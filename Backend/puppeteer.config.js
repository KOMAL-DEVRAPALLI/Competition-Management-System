import { join } from "path";

export default {
  cacheDirectory: join(process.cwd(), ".puppeteer-cache"),
};