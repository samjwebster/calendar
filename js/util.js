/* UTILITY */
// var nScale, nStrength;
// function setupUtil(width, height) {
//     nScale = 0.01;
//     nStrength = min(0.01*width, 0.01*height);
// }

function granulate(amount, blur=0) {
    loadPixels();
    const d = pixelDensity();
    const pixelsCount = 4 * (width * d) * (height * d);
    for (let i = 0; i < pixelsCount; i += 4) {
        const grainAmount = random(-amount, amount);
        pixels[i] = pixels[i] + grainAmount;     // R
        pixels[i+1] = pixels[i+1] + grainAmount; // G
        pixels[i+2] = pixels[i+2] + grainAmount; // B
        pixels[i+3] = pixels[i+3] + grainAmount; // A
    }
    updatePixels();
    if(blur) filter(BLUR, blur);
}

function granulateColor(amount, blur=0) {
    loadPixels();
    const d = pixelDensity();
    const pixelsCount = 4 * (width * d) * (height * d);
    for (let i = 0; i < pixelsCount; i += 4) {
        // const grainAmount = random(-amount, amount);
        pixels[i] = pixels[i] + random(-amount, amount);     // R
        pixels[i+1] = pixels[i+1] + random(-amount, amount); // G
        pixels[i+2] = pixels[i+2] + random(-amount, amount); // B
        pixels[i+3] = pixels[i+3] + random(-amount, amount); // A
    }
    updatePixels();
    if(blur) filter(BLUR, blur);
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = floor(random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function linearGradient(sX, sY, eX, eY, colorS, colorE){
    let gradient = drawingContext.createLinearGradient(
         sX, sY, eX, eY
    );
    gradient.addColorStop(0, colorS);
    gradient.addColorStop(1, colorE);
    drawingContext.fillStyle = gradient;
}

function radialGradient(sX, sY, sR, eX, eY, eR, colorS, colorE){
    let gradient = drawingContext.createRadialGradient(
        sX, sY, sR, eX, eY, eR
    );
    gradient.addColorStop(0, colorS);
    gradient.addColorStop(1, colorE);
    drawingContext.fillStyle = gradient;
}

function lerpPos(p1, p2, t) {
    let x = lerp(p1[0], p2[0], t);
    let y = lerp(p1[1], p2[1], t);
    return [x, y];
}

function wobbleCol(col, max = 0.1) {
    let rCol = color(round(random(255)), round(random(255)), round(random(255)));
    return lerpColor(col, rCol, random(0.01, max));
}

function nPoint(point, strength = 1) {
    let a = lerp(0, 2*PI, noise(point[0] * nScale, point[1] * nScale));
    let x = point[0] + cos(a)*strength;
    let y = point[1] + sin(a)*strength;
    return [x, y];
}

function n(pt) {
    if(pt.length > 0 && pt.length <= 3) {
        pt.map(p => p*nScale);
        return noise(...pt);
    }
    return null;
}

function randomProperty(obj) {
    var keys = Object.keys(obj);
    return obj[keys[keys.length*random()<<0]];
};

function lerpVec(v1, v2, t) {
    return createVector(lerp(v1.x, v2.x, t), lerp(v1.y, v2.y, t));
}

function transCol(col, t) {
    return color(red(col), green(col), blue(col), 255*t);
}