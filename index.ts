import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "node:os";
import execa, { ExecaChildProcess } from "execa";
import tempy from "tempy";
import fileUrl from "file-url";

const getRandomId = () => Math.random().toString(36).slice(2, 15);

// Workaround for https://github.com/electron/electron/issues/9459
// const BIN = path.join(fixPathForAsarUnpack(__dirname), "aperture");
const BIN = path.join(__dirname, "screencapturekit", "dist");

const supportsHevcHardwareEncoding = (() => {
  const cpuModel = os.cpus()[0].model;

  // All Apple silicon Macs support HEVC hardware encoding.
  if (cpuModel.startsWith("Apple ")) {
    // Source string example: `'Apple M1'`
    return true;
  }

  // Get the Intel Core generation, the `4` in `Intel(R) Core(TM) i7-4850HQ CPU @ 2.30GHz`
  // More info: https://www.intel.com/content/www/us/en/processors/processor-numbers.html
  // Example strings:
  // - `Intel(R) Core(TM) i9-9980HK CPU @ 2.40GHz`
  // - `Intel(R) Core(TM) i7-4850HQ CPU @ 2.30GHz`
  const result = /Intel.*Core.*i\d+-(\d)/.exec(cpuModel);

  // Intel Core generation 6 or higher supports HEVC hardware encoding
  return result && Number.parseInt(result[1], 10) >= 6;
})();

function getCodecs() {
  const codecs = new Map([
    ["h264", "H264"],
    ["hevc", "HEVC"],
    ["proRes422", "Apple ProRes 422"],
    ["proRes4444", "Apple ProRes 4444"],
  ]);

  if (!supportsHevcHardwareEncoding) {
    codecs.delete("hevc");
  }

  return codecs;
}

const videoCodecs = getCodecs();

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RecordingOptions = {
  fps: number;
  cropArea?: CropArea;
  showCursor: boolean;
  highlightClicks: boolean;
  screenId: number;
  audioDeviceId?: number;
  videoCodec: string;
};

type RecordingOptionsForScreenCaptureKit = {
  destination: string;
  framesPerSecond: number;
  showCursor: boolean;
  highlightClicks: boolean;
  screenId: number;
  audioDeviceId?: number;
  videoCodec?: string;
  cropRect?: [[x: number, y: number], [width: number, height: number]];
};

const execFileAsync = promisify(execFile);

class ScreenCaptureKit {
  private executablePath: string;
  videoPath: string | null = null;
  recorder?: ExecaChildProcess;
  processId: string | null = null;

  throwIfNotStarted() {
    if (this.recorder === undefined) {
      throw new Error("Call `.startRecording()` first");
    }
  }

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

  async startAudioRecording({
    audioDeviceId,
  }: {
    audioDeviceId?: number;
  } = {}) {
    this.processId = getRandomId();
    return new Promise((resolve, reject) => {
      if (this.recorder !== undefined) {
        reject(new Error("Call `.stopRecording()` first"));
        return;
      }

      this.videoPath = tempy.file({ extension: "m4a" });
      const recorderOptions = {
        destination: fileUrl(this.videoPath),
        framesPerSecond: 30,
        showCursor: false,
        highlightClicks: false,
        screenId: 0,
        audioDeviceId,
      };

      const timeout = setTimeout(resolve, 1000);
      this.recorder = execa(this.executablePath, [
        "record",
        JSON.stringify(recorderOptions),
      ]);

      this.recorder.catch((error) => {
        console.error("Recorder error:", error);
        clearTimeout(timeout);
        delete this.recorder;
        reject(error);
      });

      this.recorder?.stdout?.setEncoding("utf8");
      this.recorder?.stdout?.on("data", (data) => {
        console.log("From swift executable: ", data);
      });

      this.recorder?.stderr?.setEncoding("utf8");
      this.recorder?.stderr?.on("data", (data) => {
        console.error("Stderr from swift executable:", data);
      });
    });
  }

  async startRecording({
    fps = 30,
    cropArea = undefined,
    showCursor = true,
    highlightClicks = false,
    screenId = 0,
    audioDeviceId = undefined,
    videoCodec = "h264",
  }: Partial<RecordingOptions> = {}) {
    this.processId = getRandomId();
    return new Promise((resolve, reject) => {
      if (this.recorder !== undefined) {
        reject(new Error("Call `.stopRecording()` first"));
        return;
      }

      this.videoPath = tempy.file({ extension: "mp4" });
      const recorderOptions: RecordingOptionsForScreenCaptureKit = {
        destination: fileUrl(this.videoPath),
        framesPerSecond: fps,
        showCursor,
        highlightClicks,
        screenId,
        audioDeviceId,
      };

      if (highlightClicks === true) {
        showCursor = true;
      }

      if (
        typeof cropArea === "object" &&
        (typeof cropArea.x !== "number" ||
          typeof cropArea.y !== "number" ||
          typeof cropArea.width !== "number" ||
          typeof cropArea.height !== "number")
      ) {
        reject(new Error("Invalid `cropArea` option object"));
        return;
      }

      if (videoCodec) {
        if (!videoCodecs.has(videoCodec)) {
          throw new Error(`Unsupported video codec specified: ${videoCodec}`);
        }

        recorderOptions.videoCodec = videoCodecs.get(videoCodec);
      }
      if (cropArea) {
        recorderOptions.cropRect = [
          [cropArea.x, cropArea.y],
          [cropArea.width, cropArea.height],
        ];
      }

      // const timeout = setTimeout(() => {
      // 	// `.stopRecording()` was called already
      // 	if (this.recorder === undefined) {
      // 		return;
      // 	}

      // 	const error = new Error('Could not start recording within 5 seconds');
      // 	error.code = 'RECORDER_TIMEOUT';
      // 	this.recorder.kill();
      // 	delete this.recorder;
      // 	reject(error);
      // }, 5000);

      // (async () => {
      // 	try {
      // 		await this.waitForEvent('onStart');
      // 		clearTimeout(timeout);
      // 		setTimeout(resolve, 1000);
      // 	} catch (error) {
      // 		reject(error);
      // 	}
      // })();

      // this.isFileReady = (async () => {
      // 	await this.waitForEvent('onFileReady');
      // 	return this.tmpPath;
      // })();

      const timeout = setTimeout(resolve, 1000);
      this.recorder = execa(BIN, [
        "record",
        // "--process-id",
        // this.processId,
        JSON.stringify(recorderOptions),
      ]);

      this.recorder.catch((error) => {
        clearTimeout(timeout);
        delete this.recorder;
        reject(error);
      });

      this.recorder?.stdout?.setEncoding("utf8");
      this.recorder?.stdout?.on("data", (data) => {
        console.log("From swift executable: ", data);
      });
    });
  }

  async stopRecording() {
    this.throwIfNotStarted();
    console.log("killing recorder");
    this.recorder?.kill();
    await this.recorder;
    console.log("killed recorder");
    delete this.recorder;
    // delete this.isFileReady;

    return this.videoPath;
  }
}

export default ScreenCaptureKit;
