import fs from 'fs/promises';
import path from 'path';

export class Database {
  constructor(filename) {
    this.filePath = path.join(process.cwd(), 'database', filename);
    this.data = null;
  }

  async load() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content);
      return this.data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.data = {};
        await this.save();
        return this.data;
      }
      throw error;
    }
  }

  async save() {
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  async get(key) {
    if (!this.data) await this.load();
    return this.data[key];
  }

  async set(key, value) {
    if (!this.data) await this.load();
    this.data[key] = value;
    await this.save();
  }
}
