var model;
async function loadModel() {
    model = await tf.loadGraphModel('TFJS/model.json')
}

function predictImage() {
    // console.log('processing...');

    let image = cv.imread(canvas);
    cv.cvtColor(image, image, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(image, image, 175, 255, cv.THRESH_BINARY);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    // You can try more different parameters
    cv.findContours(image, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    let cnt = contours.get(0);
    // You can try more different parameters
    let rect = cv.boundingRect(cnt);
    image = image.roi(rect);

    var height = image.rows;
    var width = image.cols;
    if (height > width) {
        const scaleFactor = height/20;
        height = 20;
        width = Math.round(width / scaleFactor);
    } else{
        const scaleFactor = width/20;
        width = 20;
        height = Math.round(width / scaleFactor);
        }
    
    let dsize = new cv.Size(width, height);   
    cv.resize(image, image, dsize, 0, 0, cv.INTER_AREA);

    const LEFT = Math.ceil(4 + ((20 - width)/2)); //Math.ceil round to upper int
    const RIGHT = Math.floor(4 + ((20 - width)/2)); //Math.floor round to lower int
    const TOP = Math.ceil(4 + ((20 - height)/2));
    const BOTTOM = Math.floor(4 + ((20 - height)/2));
    // console.log(`top: ${TOP} bottom: ${BOTTOM} right: ${RIGHT} left: ${LEFT}`);

    let s = new cv.Scalar(0, 0, 0, 255);
    cv.copyMakeBorder(image, image, TOP, BOTTOM, LEFT, RIGHT, cv.BORDER_CONSTANT, s);

    //Center of Mass
    cv.findContours(image, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    cnt = contours.get(0);
    const Moments = cv.moments(cnt, false);


    const cx = Moments.m10 / Moments.m00;
    const cy = Moments.m01 / Moments.m00;
    // console.log(`M00: ${Moments.m00}, cx: ${cx}, cy: ${cy}`);

    const X_SHIFT = Math.round(image.cols/2.0 - cx);
    const Y_SHIFT = Math.round(image.rows/2.0 - cy);

    let newSize = new cv.Size(image.cols, image.rows);
    let M = cv.matFromArray(2, 3, cv.CV_64FC1, [1, 0, X_SHIFT, 0, 1, Y_SHIFT]);
    // You can try more different parameters
    cv.warpAffine(image, image, M, newSize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, s);

    let pixelValues = image.data;
    // console.log(`pixelValues: ${pixelValues}`)

    // Normalize Data
    pixelValues = Float32Array.from(pixelValues) // to convert int to float, otherwise we got 0 & 0 when devide by 255
    pixelValues = pixelValues.map(function(item){
        return item/255.0
    });
    // console.log(`${pixelValues}`);

    const X = tf.tensor([pixelValues]);
    // console.log(`Data type of tensor is: ${X.dtype}`);
    // console.log(`Shape of tensor is: ${X.shape}`);

    const result = model.predict(X)
    result.print();
    const output = result.dataSync()[0]; // dataSync() method on tensorflow rerturn a array
    // console.log(tf.memory());


    // Testing Only
    // const outputCanvas = document.createElement('CANVAS');
    // cv.imshow(outputCanvas, image);
    // document.body.appendChild(outputCanvas);




    // Cleanup
    image.delete();
    contours.delete();
    hierarchy.delete();
    cnt.delete();
    M.delete();
    X.dispose();
    result.dispose();


    return output // when we use retun method, next operations never triggered so we use it blow delete functions


}