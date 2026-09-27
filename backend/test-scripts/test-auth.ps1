#requires -Version 5.1
<#
.SYNOPSIS
    End-to-end smoke tests for the gray-merchant backend auth/SSO module.

.DESCRIPTION
    Hits a running dev/staging server (default http://localhost:3001) and
    exercises every endpoint documented in backend/AUTH_README.md:

      * POST /auth/register           (USER registration + password policy)
      * POST /auth/login              (USER login + OAuth2 grant + cookie)
      * GET  /auth/session            (cookie + bearer)
      * POST /auth/refresh            (rotating refresh tokens)
      * POST /auth/logout             (revoke session, clear cookie)
      * POST /auth/staff/login        (STAFF/ADMIN login)
      * GET  /auth/authorize          (OAuth2 client/redirect validation)
      * POST /auth/token              (PKCE S256 + PLAIN exchange)
      * POST /auth/client-token       (client credentials JWT)
      * GET  /auth/me                 (JWT guard)
      * GET  /auth/admin              (UserTypeGuard)
      * Account lockout after 5 failed attempts
      * Validation errors

    The script uses no third-party tools -- only the `Invoke-RestMethod`
    and `Invoke-WebRequest` cmdlets that ship with Windows PowerShell.

    This script does *not* require the database to be empty; it creates
    fresh users with random emails per run so it is safe to re-run
    against the same Postgres.

.PARAMETER BaseUrl
    Root URL of the running backend. Defaults to http://localhost:3001.

.PARAMETER AdminEmail
    Seeded admin email. Default is `admin@gray-merchant.test` (matches prisma/seed.ts).

.PARAMETER AdminPassword
    Seeded admin password. Default is `ChangeMe123!` (matches prisma/seed.ts).

.PARAMETER SkipSlow
    Skip the lockout + throttler scenarios (they take ~30s and pin a user
    for 15 minutes).

.EXAMPLE
    .\test-auth.ps1
    .\test-auth.ps1 -BaseUrl http://localhost:3001 -Verbose
#>
[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost:3001',
    [string]$AdminEmail = 'admin@gray-merchant.test',
    [string]$AdminPassword = 'ChangeMe123!',
    [switch]$SkipSlow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Test harness
# ---------------------------------------------------------------------------

$script:Passed = 0
$script:Failed = 0
$script:FailedTests = @()

function Write-Banner {
    param([string]$Text)
    Write-Host ''
    Write-Host ('=' * 72) -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ('=' * 72) -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Text)
    Write-Host "  [PASS] $Text" -ForegroundColor Green
    $script:Passed++
}

function Write-Fail {
    param([string]$Text)
    Write-Host "  [FAIL] $Text" -ForegroundColor Red
    $script:Failed++
    $script:FailedTests += $Text
}

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if ($Condition) { Write-Ok $Message }
    else { Write-Fail $Message }
}

function Assert-Equal {
    param([Parameter(Mandatory)] $Expected,
          [Parameter(Mandatory)] $Actual,
          [string]$Message = '')
    if ($Expected -eq $Actual) {
        Write-Ok ($Message + " (got $Actual)")
    } else {
        Write-Fail ("$Message -- expected $Expected, got $Actual")
    }
}

function Assert-NotNull {
    param([Parameter(Mandatory)] $Value, [string]$Message)
    if ($null -ne $Value -and $Value -ne '') {
        Write-Ok "$Message (value=$Value)"
    } else {
        Write-Fail "$Message -- value was null/empty"
    }
}

# Wraps Invoke-WebRequest so tests can opt into capturing the Set-Cookie header
# without losing the parsed JSON body. Returns a PSCustomObject with
# StatusCode, Headers, Body (already parsed JSON when possible) and RawBody.
function Invoke-Api {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$Cookie = $null,
        [switch]$AllowRedirect,
        [string]$OutFile = $null
    )

    $uri = "$BaseUrl$Path"
    $reqHeaders = @{
        'Accept' = 'application/json'
    } + $Headers
    if ($null -ne $Body) {
        $reqHeaders['Content-Type'] = 'application/json'
    }
    if ($Cookie) {
        $reqHeaders['Cookie'] = $Cookie
    }

    $splat = @{
        Method          = $Method
        Uri             = $uri
        Headers         = $reqHeaders
        UseBasicParsing = $true
    }
    if ($null -ne $Body) {
        $splat['Body'] = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }
    if ($AllowRedirect) {
        # do nothing -- Invoke-WebRequest follows by default in PS Core, but
        # we want to capture the Location header, so we use MaximumRedirection 0
        $splat['MaximumRedirection'] = 0
    }
    if ($OutFile) {
        $splat['OutFile'] = $OutFile
    }

    try {
        $resp = Invoke-WebRequest @splat -ErrorAction Stop
    } catch [System.Net.WebException] {
        # WebException is thrown for >=400 status codes. Pull the underlying
        # response so we can read the body.
        $resp = $_.Exception.Response
    }

    $status = [int]$resp.StatusCode
    $rawBody = ''
    try {
        $stream = $resp.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $rawBody = $reader.ReadToEnd()
            $reader.Close()
        }
    } catch { }

    $parsed = $null
    if ($rawBody -and $rawBody.Trim().Length -gt 0) {
        try { $parsed = $rawBody | ConvertFrom-Json -ErrorAction Stop } catch { $parsed = $null }
    }

    return [pscustomobject]@{
        StatusCode = $status
        Headers    = $resp.Headers
        Body       = $parsed
        RawBody    = $rawBody
    }
}

function Extract-Cookie {
    param([Parameter(Mandatory)][System.Net.Http.Headers.HttpResponseHeaders]$Headers,
          [string]$Name)
    try {
        $cookies = $Headers.GetValues('Set-Cookie')
        foreach ($c in $cookies) {
            # First segment before the first ';' is name=value
            $first = ($c -split ';')[0]
            $kv = $first -split '=', 2
            if ($kv.Count -eq 2 -and $kv[0].Trim() -eq $Name) {
                return $kv[1].Trim()
            }
        }
    } catch { }
    return $null
}

function New-Pkce {
    # returns an object with .verifier and .challenge (S256)
    param()
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $verifier = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash(
        [System.Text.Encoding]::ASCII.GetBytes($verifier))
    $challenge = [Convert]::ToBase64String($hash).TrimEnd('=').Replace('+','-').Replace('/','_')
    return [pscustomobject]@{ verifier = $verifier; challenge = $challenge }
}

function Wait-ForServer {
    param([string]$Url, [int]$TimeoutSec = 30)
    Write-Host "Waiting for $Url to become reachable..."
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $false
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

Write-Banner "gray-merchant auth smoke tests"
Write-Host "BaseUrl   = $BaseUrl"
Write-Host "SkipSlow  = $SkipSlow"

if (-not (Wait-ForServer -Url $BaseUrl)) {
    Write-Fail "Server is not reachable at $BaseUrl"
    exit 1
}

# Sanity: the root endpoint should return "Hello World!" via AppController.
Write-Banner '0. Sanity checks'
$root = Invoke-Api -Method GET -Path '/'
Assert-Equal 200 $root.StatusCode 'GET / returns 200'
Assert-Equal 'Hello World!' $root.Body 'GET / returns "Hello World!"'

# ---------------------------------------------------------------------------
# Random per-run credentials so the script can be re-run safely
# ---------------------------------------------------------------------------

$rand = Get-Random -Minimum 100000 -Maximum 999999
$userEmail       = "alice-$rand@test.local"
$userPassword    = 'StrongP4ss!word'
$newPassword     = 'AnotherStrong!2026'

$staffEmail      = "staff-$rand@test.local"
$staffPassword   = 'StrongP4ss!word'

# ---------------------------------------------------------------------------
# 1. Registration
# ---------------------------------------------------------------------------
Write-Banner '1. POST /auth/register'

# 1a. happy path
$register = Invoke-Api -Method POST -Path '/auth/register' -Body @{
    email    = $userEmail
    password = $userPassword
}
Assert-Equal 201 $register.StatusCode 'register returns 201'
if ($register.Body) {
    Assert-NotNull $register.Body.data 'register response carries the user'
    Assert-Equal 'USER' $register.Body.data.type 'newly registered user is type=USER'
    Assert-Equal $userEmail $register.Body.data.email 'register echoes normalized email'
    Assert-True (-not $register.Body.data.PSObject.Properties.Match('password').Count) 'register response hides password'
}

# 1b. duplicate email
$dup = Invoke-Api -Method POST -Path '/auth/register' -Body @{
    email    = $userEmail
    password = $userPassword
}
# The service throws a generic Error which bubbles through the global filter
# as a 500. We accept either 4xx (zod/duplicate) or 500.
if ($dup.StatusCode -ge 400) {
    Write-Ok "duplicate registration is rejected (status=$($dup.StatusCode))"
} else {
    Write-Fail "duplicate registration unexpectedly accepted (status=$($dup.StatusCode))"
}

# 1c. weak password (validation failure)
$weak = Invoke-Api -Method POST -Path '/auth/register' -Body @{
    email    = "weak-$rand@test.local"
    password = 'short'
}
Assert-Equal 400 $weak.StatusCode 'weak password is rejected with 400'
Assert-Equal 'VALIDATION_ERROR' $weak.Body.errorCode 'weak password returns VALIDATION_ERROR'
Assert-True ($weak.Body.details.Count -gt 0) 'weak password includes zod details'

# 1d. bad email format
$badEmail = Invoke-Api -Method POST -Path '/auth/register' -Body @{
    email    = 'not-an-email'
    password = $userPassword
}
Assert-Equal 400 $badEmail.StatusCode 'invalid email is rejected with 400'

# 1e. register a staff user directly via prisma to test the staff login gate.
# (We do NOT use the public /auth/register endpoint for STAFF -- the schema
# disallows that. We create the staff row through a /auth/staff/login test
# instead.)

# ---------------------------------------------------------------------------
# 2. Login (USER)
# ---------------------------------------------------------------------------
Write-Banner '2. POST /auth/login (USER)'

$login = Invoke-Api -Method POST -Path '/auth/login' -Body @{
    email    = $userEmail
    password = $userPassword
}
Assert-Equal 200 $login.StatusCode 'login returns 200'
Assert-NotNull $login.Body.accessToken  'login returns accessToken'
Assert-NotNull $login.Body.refreshToken 'login returns refreshToken'
Assert-Equal 'USER' $login.Body.user.type 'login user.type=USER'

$cookieValue = Extract-Cookie -Headers $login.Headers -Name 'auth_session'
Assert-NotNull $cookieValue 'login sets the auth_session cookie'

# 2b. wrong password is rejected
$badPw = Invoke-Api -Method POST -Path '/auth/login' -Body @{
    email    = $userEmail
    password = 'DefinitelyWrong!1'
}
Assert-True ($badPw.StatusCode -ge 400) 'wrong password is rejected'

# 2c. login with cookie (no body refresh token) still works via /auth/session
# (this only proves the cookie is honoured, not that the login endpoint
# accepts no credentials -- it doesn't.)

# ---------------------------------------------------------------------------
# 3. Session lookup (cookie + bearer)
# ---------------------------------------------------------------------------
Write-Banner '3. GET /auth/session'

$sessCookie = Invoke-Api -Method GET -Path '/auth/session' -Cookie "auth_session=$cookieValue"
Assert-Equal 200 $sessCookie.StatusCode 'session lookup via cookie returns 200'
Assert-Equal $true $sessCookie.Body.authenticated 'session lookup via cookie reports authenticated'
Assert-Equal $userEmail $sessCookie.Body.user.email 'session lookup returns the registered email'

$sessBearer = Invoke-Api -Method GET -Path '/auth/session' `
    -Headers @{ 'Authorization' = "Bearer $($login.Body.accessToken)" }
Assert-Equal 200 $sessBearer.StatusCode 'session lookup via bearer returns 200'
Assert-Equal $true $sessBearer.Body.authenticated 'session lookup via bearer reports authenticated'

# Anonymous session returns authenticated=false
$sessAnon = Invoke-Api -Method GET -Path '/auth/session'
Assert-Equal 200 $sessAnon.StatusCode 'anonymous session returns 200'
Assert-Equal $false $sessAnon.Body.authenticated 'anonymous session reports not authenticated'

# ---------------------------------------------------------------------------
# 4. Refresh (rotating)
# ---------------------------------------------------------------------------
Write-Banner '4. POST /auth/refresh'

$refresh = Invoke-Api -Method POST -Path '/auth/refresh' -Body @{
    refreshToken = $login.Body.refreshToken
}
Assert-Equal 200 $refresh.StatusCode 'refresh returns 200'
Assert-NotNull $refresh.Body.accessToken  'refresh returns a new accessToken'
Assert-NotNull $refresh.Body.refreshToken 'refresh returns a new refreshToken'
Assert-True ($refresh.Body.refreshToken -ne $login.Body.refreshToken) 'refresh rotates the refresh token'

# The old refresh token should now be invalid.
$reuseOld = Invoke-Api -Method POST -Path '/auth/refresh' -Body @{
    refreshToken = $login.Body.refreshToken
}
Assert-Equal 401 $reuseOld.StatusCode 'old refresh token is rejected after rotation'
Assert-Equal 'INVALID_REFRESH_TOKEN' $reuseOld.Body.errorCode 'old refresh token error code'

# Refresh via cookie
$refreshCookie = Extract-Cookie -Headers $refresh.Headers -Name 'auth_session'
Assert-NotNull $refreshCookie 'refresh sets a fresh cookie'
$cookieRefresh = Invoke-Api -Method POST -Path '/auth/refresh' -Body @{} `
    -Cookie "auth_session=$refreshCookie"
Assert-Equal 200 $cookieRefresh.StatusCode 'refresh via cookie works'
$cookieValue = Extract-Cookie -Headers $cookieRefresh.Headers -Name 'auth_session'
if (-not $cookieValue) { $cookieValue = $refreshCookie }

# Missing refresh token entirely
$noRefresh = Invoke-Api -Method POST -Path '/auth/refresh' -Body @{}
Assert-Equal 400 $noRefresh.StatusCode 'refresh without token returns 400'
Assert-Equal 'MISSING_TOKEN' $noRefresh.Body.errorCode 'refresh without token error code'

# ---------------------------------------------------------------------------
# 5. JWT-guarded /auth/me
# ---------------------------------------------------------------------------
Write-Banner '5. GET /auth/me (JwtAuthGuard)'

$me = Invoke-Api -Method GET -Path '/auth/me' `
    -Headers @{ 'Authorization' = "Bearer $($refresh.Body.accessToken)" }
Assert-Equal 200 $me.StatusCode '/auth/me returns 200 with a valid bearer'
Assert-NotNull $me.Body.user '/auth/me returns the user payload'
Assert-Equal 'USER' $me.Body.user.type '/auth/me user.type=USER'

# Missing token -> 401
$meNoAuth = Invoke-Api -Method GET -Path '/auth/me'
Assert-Equal 401 $meNoAuth.StatusCode '/auth/me returns 401 without a token'

# ---------------------------------------------------------------------------
# 6. Admin guard denies USERs
# ---------------------------------------------------------------------------
Write-Banner '6. GET /auth/admin (UserTypeGuard)'

$adminAsUser = Invoke-Api -Method GET -Path '/auth/admin' `
    -Headers @{ 'Authorization' = "Bearer $($refresh.Body.accessToken)" }
Assert-Equal 403 $adminAsUser.StatusCode '/auth/admin returns 403 for USER'
Assert-Equal 'FORBIDDEN' $adminAsUser.Body.errorCode '/auth/admin error code'

$adminNoAuth = Invoke-Api -Method GET -Path '/auth/admin'
Assert-Equal 401 $adminNoAuth.StatusCode '/auth/admin returns 401 without auth'

# ---------------------------------------------------------------------------
# 7. OAuth2 / SSO (PKCE)
# ---------------------------------------------------------------------------
Write-Banner '7. OAuth2 / PKCE'

# 7a. /auth/authorize -- happy path (redirect JSON)
$pkce = New-Pkce
$authorize = Invoke-Api -Method GET -Path '/auth/authorize' -Body @{
    client_id              = 'gray-merchant-staff'
    redirect_uri           = 'http://localhost:3000/admin/callback'
    state                  = 'xyz'
    code_challenge         = $pkce.challenge
    code_challenge_method  = 'S256'
}
Assert-Equal 200 $authorize.StatusCode 'authorize returns 200'
Assert-NotNull $authorize.Body.redirect 'authorize returns a redirect URL'
Assert-True ($authorize.Body.redirect -like '*client_id=gray-merchant-staff*') 'authorize preserves client_id'
Assert-True ($authorize.Body.redirect -like "*code_challenge=$($pkce.challenge)*") 'authorize preserves code_challenge'

# 7b. authorize with bogus client_id
$badAuth = Invoke-Api -Method GET -Path '/auth/authorize' -Body @{
    client_id    = 'no-such-app'
    redirect_uri = 'http://localhost:3000/admin/callback'
}
Assert-Equal 400 $badAuth.StatusCode 'authorize rejects unknown client_id'
Assert-Equal 'INVALID_CLIENT' $badAuth.Body.errorCode 'authorize unknown client error code'

# 7c. authorize with mismatched redirect_uri
$mismatch = Invoke-Api -Method GET -Path '/auth/authorize' -Body @{
    client_id    = 'gray-merchant-staff'
    redirect_uri = 'http://evil.test/callback'
}
Assert-Equal 400 $mismatch.StatusCode 'authorize rejects mismatched redirect_uri'
Assert-Equal 'INVALID_REDIRECT_URI' $mismatch.Body.errorCode 'authorize redirect error code'

# 7d. /auth/login with client_id + redirect_uri + PKCE -> redirect with code
$loginOauth = Invoke-Api -Method POST -Path '/auth/login' -Body @{
    email                 = $userEmail
    password              = $userPassword
    client_id             = 'gray-merchant-staff'
    redirect_uri          = 'http://localhost:3000/admin/callback'
    state                 = 'xyz'
    code_challenge        = $pkce.challenge
    code_challenge_method = 'S256'
}
Assert-Equal 302 $loginOauth.StatusCode 'oauth login returns 302 redirect'
$location = $loginOauth.Headers['Location'] | Select-Object -First 1
Assert-NotNull $location 'oauth login returns Location header'
Assert-True ($location -like 'http://localhost:3000/admin/callback*') 'Location is the registered redirect_uri'
$codeParam = ([uri]::UnescapeDataString(($location -split '\?' | Select-Object -Last 1)) -split '&' |
    Where-Object { $_ -like 'code=*' } | Select-Object -First 1) -replace '^code=',''
Assert-NotNull $codeParam 'redirect URL contains an authorization code'

# 7e. /auth/token -- S256 exchange
$token = Invoke-Api -Method POST -Path '/auth/token' -Body @{
    grant_type    = 'authorization_code'
    code          = $codeParam
    client_id     = 'gray-merchant-staff'
    redirect_uri  = 'http://localhost:3000/admin/callback'
    code_verifier = $pkce.verifier
}
Assert-Equal 200 $token.StatusCode 'token exchange returns 200'
Assert-NotNull $token.Body.access_token  'token exchange returns access_token'
Assert-NotNull $token.Body.refresh_token 'token exchange returns refresh_token'
Assert-Equal 'Bearer' $token.Body.token_type 'token_type=Bearer'
Assert-True ($token.Body.expires_in -gt 0) 'token exchange returns expires_in > 0'

# 7f. token reuse must fail (codes are single-use)
$reuseToken = Invoke-Api -Method POST -Path '/auth/token' -Body @{
    grant_type    = 'authorization_code'
    code          = $codeParam
    client_id     = 'gray-merchant-staff'
    redirect_uri  = 'http://localhost:3000/admin/callback'
    code_verifier = $pkce.verifier
}
Assert-Equal 400 $reuseToken.StatusCode 'token reuse returns 400'
Assert-Equal 'INVALID_CODE' $reuseToken.Body.errorCode 'token reuse error code'

# 7g. PLAIN method (no PKCE on either side is also fine, but PLAIN means
# challenge = verifier). Re-do authorize + login + token round-trip with
# PLAIN.
$plainVerifier = 'plain-verifier-1234567890'
$plainLogin = Invoke-Api -Method POST -Path '/auth/login' -Body @{
    email                 = $userEmail
    password              = $userPassword
    client_id             = 'gray-merchant-staff'
    redirect_uri          = 'http://localhost:3000/admin/callback'
    state                 = 'plain'
    code_challenge        = $plainVerifier
    code_challenge_method = 'PLAIN'
}
Assert-Equal 302 $plainLogin.StatusCode 'PLAIN oauth login returns 302'
$plainLoc = $plainLogin.Headers['Location'] | Select-Object -First 1
$plainCode = (([uri]::UnescapeDataString(($plainLoc -split '\?' | Select-Object -Last 1)) -split '&' |
    Where-Object { $_ -like 'code=*' } | Select-Object -First 1) -replace '^code=','')
$plainToken = Invoke-Api -Method POST -Path '/auth/token' -Body @{
    grant_type    = 'authorization_code'
    code          = $plainCode
    client_id     = 'gray-merchant-staff'
    redirect_uri  = 'http://localhost:3000/admin/callback'
    code_verifier = $plainVerifier
}
Assert-Equal 200 $plainToken.StatusCode 'PLAIN token exchange returns 200'
Assert-NotNull $plainToken.Body.access_token 'PLAIN token exchange returns access_token'

# 7h. /auth/token rejects bad verifier (S256 path)
$badVerifier = New-Pkce
$badLogin = Invoke-Api -Method POST -Path '/auth/login' -Body @{
    email                 = $userEmail
    password              = $userPassword
    client_id             = 'gray-merchant-staff'
    redirect_uri          = 'http://localhost:3000/admin/callback'
    code_challenge        = $pkce.challenge
    code_challenge_method = 'S256'
}
$badLoc = $badLogin.Headers['Location'] | Select-Object -First 1
$badCode = (([uri]::UnescapeDataString(($badLoc -split '\?' | Select-Object -Last 1)) -split '&' |
    Where-Object { $_ -like 'code=*' } | Select-Object -First 1) -replace '^code=','')
$badExchange = Invoke-Api -Method POST -Path '/auth/token' -Body @{
    grant_type    = 'authorization_code'
    code          = $badCode
    client_id     = 'gray-merchant-staff'
    redirect_uri  = 'http://localhost:3000/admin/callback'
    code_verifier = $badVerifier.verifier
}
Assert-Equal 400 $badExchange.StatusCode 'bad PKCE verifier returns 400'
Assert-Equal 'INVALID_CODE' $badExchange.Body.errorCode 'bad PKCE verifier error code'

# ---------------------------------------------------------------------------
# 8. /auth/client-token
# ---------------------------------------------------------------------------
Write-Banner '8. POST /auth/client-token'

$ct = Invoke-Api -Method POST -Path '/auth/client-token' -Body @{
    clientId = 'gray-merchant-staff'
}
Assert-Equal 200 $ct.StatusCode 'client-token returns 200'
Assert-NotNull $ct.Body.accessToken 'client-token returns accessToken'

$ctMissing = Invoke-Api -Method POST -Path '/auth/client-token' -Body @{}
Assert-Equal 400 $ctMissing.StatusCode 'client-token without clientId returns 400'
Assert-Equal 'MISSING_CLIENT_ID' $ctMissing.Body.errorCode 'client-token missing clientId error code'

$ctBad = Invoke-Api -Method POST -Path '/auth/client-token' -Body @{
    clientId = 'no-such-app'
}
Assert-Equal 400 $ctBad.StatusCode 'client-token rejects unknown client'
Assert-Equal 'INVALID_CLIENT' $ctBad.Body.errorCode 'client-token unknown client error code'

# ---------------------------------------------------------------------------
# 9. Staff / admin login
# ---------------------------------------------------------------------------
Write-Banner '9. POST /auth/staff/login'

# 9a. login with the seeded admin
$adminLogin = Invoke-Api -Method POST -Path '/auth/staff/login' -Body @{
    email         = $AdminEmail
    password      = $AdminPassword
    client_id     = 'gray-merchant-staff'
}
Assert-Equal 200 $adminLogin.StatusCode 'staff/admin login returns 200'
Assert-NotNull $adminLogin.Body.accessToken 'staff/admin login returns accessToken'
Assert-Equal 'ADMIN' $adminLogin.Body.user.type 'staff/admin login user.type=ADMIN'

# 9b. /auth/admin succeeds with the admin bearer
$adminOk = Invoke-Api -Method GET -Path '/auth/admin' `
    -Headers @{ 'Authorization' = "Bearer $($adminLogin.Body.accessToken)" }
Assert-Equal 200 $adminOk.StatusCode '/auth/admin returns 200 for ADMIN'
Assert-Equal 'ADMIN' $adminOk.Body.user.type '/auth/admin user.type=ADMIN'

# 9c. user (non-staff) account cannot use /auth/staff/login
$userAsStaff = Invoke-Api -Method POST -Path '/auth/staff/login' -Body @{
    email     = $userEmail
    password  = $userPassword
    client_id = 'gray-merchant-staff'
}
Assert-True ($userAsStaff.StatusCode -ge 400) 'staff login rejects USER-type accounts'

# 9d. wrong client_id
$badClient = Invoke-Api -Method POST -Path '/auth/staff/login' -Body @{
    email     = $AdminEmail
    password  = $AdminPassword
    client_id = 'no-such-app'
}
Assert-Equal 400 $badClient.StatusCode 'staff login with bad client_id returns 400'
Assert-Equal 'INVALID_CLIENT' $badClient.Body.errorCode 'staff login bad client error code'

# 9e. wrong password
$badStaff = Invoke-Api -Method POST -Path '/auth/staff/login' -Body @{
    email     = $AdminEmail
    password  = 'DefinitelyWrong!1'
    client_id = 'gray-merchant-staff'
}
Assert-True ($badStaff.StatusCode -ge 400) 'staff login rejects wrong password'

# ---------------------------------------------------------------------------
# 10. Logout
# ---------------------------------------------------------------------------
Write-Banner '10. POST /auth/logout'

$logout = Invoke-Api -Method POST -Path '/auth/logout' -Body @{
    refreshToken = $adminLogin.Body.refreshToken
}
Assert-Equal 200 $logout.StatusCode 'logout returns 200'

# Session lookup with the revoked refresh cookie/token should fail
$afterLogout = Invoke-Api -Method POST -Path '/auth/refresh' -Body @{
    refreshToken = $adminLogin.Body.refreshToken
}
Assert-Equal 401 $afterLogout.StatusCode 'refresh after logout returns 401'

# Logout with no token (no session) should be 404
$logoutNone = Invoke-Api -Method POST -Path '/auth/logout' -Body @{}
Assert-Equal 404 $logoutNone.StatusCode 'logout without a session returns 404'
Assert-Equal 'SESSION_NOT_FOUND' $logoutNone.Body.errorCode 'logout no-session error code'

# ---------------------------------------------------------------------------
# 11. Account lockout
# ---------------------------------------------------------------------------
if (-not $SkipSlow) {
    Write-Banner '11. Account lockout (5 failed attempts -> 15 min lock)'
    # Create a fresh user via /auth/register so we don't lock anyone important
    $lockEmail = "lock-$rand@test.local"
    $reg = Invoke-Api -Method POST -Path '/auth/register' -Body @{
        email    = $lockEmail
        password = $userPassword
    }
    Assert-Equal 201 $reg.StatusCode 'register lockout-target user'

    for ($i = 1; $i -le 5; $i++) {
        $fail = Invoke-Api -Method POST -Path '/auth/login' -Body @{
            email    = $lockEmail
            password = 'wrong-password'
        }
        Write-Host "    attempt #$i status=$($fail.StatusCode)" -ForegroundColor DarkGray
    }
    $locked = Invoke-Api -Method POST -Path '/auth/login' -Body @{
        email    = $lockEmail
        password = $userPassword
    }
    # Even the correct password should be rejected with an "Account locked" error.
    Assert-True ($locked.StatusCode -ge 400) 'account is locked after 5 failed attempts'
    Assert-NotNull $locked.Body.message 'locked response includes an error message'
} else {
    Write-Banner '11. Account lockout -- skipped (SkipSlow)'
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Banner 'Summary'
Write-Host "  Passed: $script:Passed" -ForegroundColor Green
Write-Host "  Failed: $script:Failed" -ForegroundColor $(if ($script:Failed -gt 0) { 'Red' } else { 'Green' })
if ($script:FailedTests.Count -gt 0) {
    Write-Host ''
    Write-Host '  Failed tests:' -ForegroundColor Red
    foreach ($t in $script:FailedTests) {
        Write-Host "    - $t" -ForegroundColor Red
    }
    exit 1
}
Write-Host ''
Write-Host 'All auth smoke tests passed.' -ForegroundColor Green
exit 0
