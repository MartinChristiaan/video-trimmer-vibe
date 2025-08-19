
Create a fast and user friendly app for trimming videos placed in a preconfigured raw directory. A (320x240) preview image extracted at every 10 seconds will be available to guide the trimming and video selection.

When the user opens the site, he is greeted with the video selection view. This will be a flexbox containing rows, where each row is intended to show a preview of one of the videos in the folder. It shows up to 4 preview images taken at evenly spaced temporal positions from the video.

When the user clicks on the row, the vidoe trimming view will open. This view contains a video player, as well as a scrollable container containing preview images.  When the user clicks on a preview image, the video will seek to the corresponding timestamp. The outline of the preview image will turn green and the timestamp is set as the starting timestamp for the clip extraction. When the user clicks on another frame in the future, the video seeks again to this timestamp. It is also solected as the end of the clip giving it, and all the preview images a green outline. The user is then presented with a button to confirm the trim.

Preview images for which the timestamp is not included in a trim, the opacity should be a bit lower.

When the trim is confirmed, the video as well as the start and stop positions are stored in a text file by the server. A seperate file should be used for each videos to store clips/trims.