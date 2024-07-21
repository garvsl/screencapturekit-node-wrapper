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
      const { stdout } = await execFileAsync(this.executablePath, [
        "list",
        "screens",
      ]);

      return stdout.trim().split(" ");
    } catch (error) {
      console.error("Error in listScreens:", error);
      throw error;
    }
  }
}

export default ScreenCaptureKit;
