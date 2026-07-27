"use client";

import { User } from "lucide-react";
import { useState } from "react";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  console.log("render");

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <User
          size={22}
          className="text-gray-600 dark:text-gray-300"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900    z-50">
          
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Miguel
            </p>
            <p className="text-xs text-gray-500">
              user@example.com
            </p>
          </div>

          <hr className="my-2 border-gray-200 dark:border-gray-700" />

          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
            My Profile
          </button>

          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
            Orders
          </button>

          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
            Settings
          </button>

          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            Logout
          </button>

        </div>
      )}
    </div>
  );
}