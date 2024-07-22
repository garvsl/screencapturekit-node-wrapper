Creds to og.

I added some ease of use capabilities/fixed soem bugs, and made into a npm package for simple integration.
No Audio recording. Just use mediaRecorder api for that--can only record microphone, but can technically capture speakers if u dont wear headset. Or simpyl use virtual device for system audio.




Example:

```
npm install screencapturekit-node-wrapper
```

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
