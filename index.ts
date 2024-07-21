import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

class ScreenCaptureKit {
  private executablePath: string;

  constructor() {
    this.executablePath = path.join(__dirname, "screencapturekit", "dist");
  }

  async listScreens() {
    try {
      const { stderr } = await execFileAsync(this.executablePath, [
        "list",
        "screens",
      ]);

      return JSON.parse(stderr);
    } catch (error) {
      console.error("Error in listScreens:", error);
      throw error;
    }
  }
}

export default ScreenCaptureKit;
