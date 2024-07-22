Added some ease of use capabilities and made into package for simple integration.
No Audio recording

Example:

```

    const sck = new ScreenCaptureKit();

    const theScreens = await sck.listScreens();

    let recording = false

    console.log('recording');
    if (recording) {
      const vidPath = await sck.stopRecording();
      alert(`Recording saved to: ${vidPath}`);
    } else {
      const options = {
        screenId: theScreens[0].process_id,
        framesPerSecond: 30,
        showCursor: true,
        audioDeviceId: 0,
        destination:
          'path/to/recording.mp4', // optional destination
        highlightClicks: false,
        videoCodec: 'h264',
      };
      await sck.startRecording(options);
    }
```
