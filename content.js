let color_distribution = new Map();
let images = [...document.getElementsByTagName('img')];

chrome.runtime.onMessage.addListener(got_request);

function got_request(request, sender, sendResponse) {
   console.log(sender.tab ?
               "from a content script:" + sender.tab.url :
               "from the extension");
   if (request.start_bubly) {
      start_bubly(request.settings);
      sendResponse({status: "Bub.ly complete"});
      console.log(color_distribution);
   }
   if (request.save_data) {
      sendResponse({status: "Bub.ly saved"});
   }
}

function start_bubly(settings) 
{
   let min_height = settings.include_small_imgs ? 1 : 100;
   let min_width = settings.include_small_imgs ? 1 : 100;
   for(idx in images){
      console.log(`processing image#${idx}`);
      console.log(`(width:${images[idx].width},height:${images[idx].height},offset width:${images[idx].offsetWidth},offset height:${images[idx].offsetHeight})`);
      if((images[idx].height >= min_height || images[idx].offsetHeight >= min_height) && (images[idx].width >= min_width || images[idx].offsetWidth >= min_width)) {
         let img_data = get_img_data(images[idx].src);
         if(img_data) process_img_data(img_data);
      }
   }
   // forAsync(images, (img, idx) => {
   //    return new Promise(resolve => {
   //       console.log(`processing image#${idx}`);
   //       if(img.height > 100 && img.width > 100) {
   //          let img_data = get_img_data(img.src);
   //          process_img_data(img_data);
   //       }
   //       resolve();
   //    })
   // });
}

function process_img_data(img_data) {
   for (let i = 0; i < img_data.data.length; i += 4) {
      let rgba = [img_data.data[i + 0], img_data.data[i + 1], img_data.data[i + 2], img_data.data[i + 3]];
      let rgba_key = gen_rgba_key(rgba);
      if(color_distribution.has(rgba_key)) color_distribution.set(rgba_key, color_distribution.get(rgba_key) + 1);
      else color_distribution.set(rgba_key, 1);
    }
}

/* Returns data of input image */
function get_img_data(url) 
{
   let img = document.createElement("img");
   img.crossOrigin = "Anonymous";
   img.src = url;
   let canvas = document.createElement('canvas');
   let context = canvas.getContext('2d');
   let width = img.width || img.offsetWidth || img.naturalWidth;
   let height = img.height || img.offsetHeight || img.naturalHeight;
   context.drawImage(img, 0, 0);
   let img_data = null;
   /* Due to browser security measures, some images will always cause errors, no fix */
   try
   {
      img_data = context.getImageData(0, 0, width, height);
   }
   catch(e)
   {
      console.log(e.message);
   }
   return img_data;
}
/* given an array of 4 8bit integers, representing an r,g,b,a value respectivley
 * creates a string representation in the form "r,g,b,a"
 */
function gen_rgba_key(rgba) 
{
   let r = rgba[0];
   let g = rgba[1];
   let b = rgba[2];
   let a = rgba[3];
   // let r = rgba[0] * (1 << 24);
   // let g = rgba[1] << 16;
   // let b = rgba[2] << 8;
   // return r + g + b + rgba[3];
   return `${r},${g},${b},${a}`;
}

/* Function Author: Stijn de Witt
 * GitHub: https://github.com/Download/for-async
 */
// function forAsync(arr, work) {
// 	function loop(arr, i) {
// 		return new Promise((resolve, reject) => {
// 			if (i >= arr.length) {resolve()}
// 			else try {
// 				Promise.resolve(work(arr[i], i))
// 				.then(() => resolve(loop(arr, i+1)))
// 				.catch(reject);
// 			} catch(error) {reject(error)}
// 		})
// 	}
// 	return loop(arr, 0);
// }