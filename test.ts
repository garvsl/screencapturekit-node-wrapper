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
}

test().catch((error) => console.error("Unhandled error:", error));
