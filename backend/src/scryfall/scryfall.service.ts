import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { Readable } from 'stream';
import { createGunzip } from 'zlib';
import * as readline from 'readline';

@Injectable()
export class ScryfallService {
  constructor(private readonly prisma: PrismaService) {}

  async syncCards() {
    const bulkUrl = await this.getBulkDownloadUrl();

    const cards = await this.downloadBulkCards(bulkUrl);



    return {
      downloaded: "done",
    };
  }

  private async getBulkDownloadUrl(): Promise<string> {
    const url = process.env.SCRYFALL_BULK_DATA_URL;

    if (!url) {
      throw new Error('SCRYFALL_BULK_DATA_URL is not set');
    }

    const response = await this.scryfallFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch bulk metadata (${response.status})`);
    }

    const data = await response.json();

    const bulk = data.data.find((item: any) => item.type === 'default_cards');

    if (!bulk) {
      throw new Error('Default Cards bulk file not found.');
    }
    console.log('Bulk download URL:', bulk.jsonl_download_uri);
    return bulk.jsonl_download_uri;
  }

  private async downloadBulkCards(url: string): Promise<void> {
  const response = await this.scryfallFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download bulk data: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty.');
  }

  // Convert the Web ReadableStream to a Node.js Readable stream
  const stream = Readable.fromWeb(response.body as any);

  // Decompress the .gz file
  const gunzip = createGunzip();

  // Pipe the download into the decompressor
  const decompressed = stream.pipe(gunzip);

  // Read line by line
  const rl = readline.createInterface({
    input: decompressed,
    crlfDelay: Infinity,
  });

  const batch: {
  scryfallId: string;
  name: string;
  imageUrl: string | null;
  setName: string;
}[] = [];

const BATCH_SIZE = 1000;

for await (const line of rl) {
  const card = JSON.parse(line);

  // Skip cards that don't have a normal image
  if (!card.image_uris?.normal) {
    continue;
  }

  batch.push({
    scryfallId: card.id,
    name: card.name,
    imageUrl: card.image_uris.normal,
    setName: card.set_name,
  });

  // Once the batch reaches 1000 cards, insert it
  if (batch.length >= BATCH_SIZE) {
    await this.prisma.card.createMany({
      data: batch,
      skipDuplicates: true,
    });

    console.log(`Inserted ${batch.length} cards`);

    // Clear the batch
    batch.length = 0;
  }
}

// Insert any remaining cards
if (batch.length > 0) {
  await this.prisma.card.createMany({
    data: batch,
    skipDuplicates: true,
  });

  console.log(`Inserted final ${batch.length} cards`);
}
}
  private async scryfallFetch(url: string) {
    return fetch(url, {
      headers: {
        'User-Agent':
          'GrayMerchant/1.0 (Development, layosmiguelraphael@gmail.com)',
        Accept: 'application/json',
      },
    });
  }
}
