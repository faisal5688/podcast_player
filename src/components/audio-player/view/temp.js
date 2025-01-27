$(document).ready(function () {
  const audio = $("#audio")[0];
  const waveform = $("#waveform");
  const numberOfBars = 20; // Number of bars you want

  // Generate bars dynamically
  for (let i = 0; i < numberOfBars; i++) {
    waveform.append('<div class="bar"></div>');
  }

  const bars = $(".bar");

  // Handle file selection
  $("#audioFile").on("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      audio.src = fileURL;
    }
  });

  // Sync soundwave animation to audio playback
  audio.addEventListener("timeupdate", function () {
    bars.each(function () {
      const randomHeight = Math.random() * 100 + 10; // Between 10px and 100px
      $(this).css("height", randomHeight + "px");
    });
  });

  // Reset soundwave when audio ends
  audio.addEventListener("ended", function () {
    bars.css("height", "20px");
  });
});
