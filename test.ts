import ScreenCaptureKit from "./index";

async function test() {
  console.log("Starting test...");
  const sck = new ScreenCaptureKit();
  console.log("ScreenCaptureKit instance created");

  try {
    console.log("Listing screens...");
    const screens = await sck.listScreens();
    console.log("Screens:", screens);
  } catch (error) {
    console.error("Test failed:", error);
  }

  try {
    console.log("Testing Record...");
    await sck.startRecording();
    // t.true(fs.existsSync(await recorder.isFileReady));
    await delay(4000);
    const videoPath = await sck.stopRecording();
    console.log({ videoPath });
  } catch (error) {
    console.error("Test failed:", error);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test().catch((error) => console.error("Unhandled error:", error));
