import { DownloadManager } from "./DownloadManager";
import { GitManager } from "./GitManager";

export class MainApp {
  constructor() {
    this.init();
  }

  init() {
    // new DownloadManager();
    new GitManager();
  }
}
