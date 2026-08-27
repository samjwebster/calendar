let p = null, c, bgCol, bgShadowCol;
let maxShadowDistance = 0;

class Palette {
    constructor(colors) {
        this.colors = colors;
        this.size = colors.length;
    }

    get(idx) {
        return this.colors[idx % this.size];
    }

    r() {
        return this.colors[floor(random() * this.size)];
    }

    shuffle() {
        this.colors = shuffle(this.colors);
    }
}

function rampensauColors() {
    push();
    let sGap = random(0.20, 0.40);
    let sStart = random(0.20, 0.30);
    let sRange = [sStart, sStart + sGap];

    let lRange = [0.3 * random(), 0.9];

    let colors = rampensau.generateColorRamp({
        total: 6,
        hStart: random() * 360,
        hCycles: random(),
        hStartCenter: 0.5,
        // hueList: hueList,
        sRange: sRange,
        lRange: lRange,
    });

    colorMode(HSB);
    colors = colors.map(c => color(c[0], c[1] * 100, c[2] * 100));
    pop();
    return colors;

}

class September {
    constructor() {

        p = new Palette(rampensauColors());
        bgCol = p.r();
        background(bgCol);
        bgShadowCol = lerpColor(bgCol, color(0, 0, 0), 0.2);

        let colSortFuncs = [null, "random", red, green, blue, hue, saturation, brightness];
        let sortFunc = random(colSortFuncs);
        if(sortFunc === "random") sortFunc = () => random();
        else if(sortFunc !== null) p.colors = p.colors.sort((a, b) => sortFunc(a) - sortFunc(b));
        if(random() < 0.5) p.colors.reverse();
        if(random() < 1 / (colSortFuncs.length + 1)) p.shuffle();


        this.mf = modfield.generateRandomFieldGroup({w: width, h: height, fieldOptions: {fieldTypes: ["line"]}});
        this.padding = random(0.01, 0.025) * min(width, height);
        this.cells = initCells(random(0.0166, 0.03) * min(width, height), this.padding);

        // Value smoothing options randomization
        this.minModVal = random(0.15, 0.4);
        this.bandTemperature = random(0.04, 0.125);
        this.bandUniformMix = random(0, 1);

        // Faux-shadow tuning controls.
        maxShadowDistance = min(width, height) * 0.075;

        for(let row of this.cells) {
            for(let cell of row) {
                let raw = this.mf.mod(cell.ctr);
                cell.modVal = this.mf.normalize(raw);
            }
        }

        this.updateSizes();


        return
    }

    updateSizes() {
        let ctX = this.cells.length;
        let ctY = this.cells[0].length;
        let colScores = this.getColumnScores(ctX, ctY);
        let rowScores = this.getRowScores(ctX, ctY);

        let colWeights = this.makeSoftmaxWeights(colScores, ctX);
        let rowWeights = this.makeSoftmaxWeights(rowScores, ctY);

        let colWidths = colWeights.map(w => w * (width - 2 * this.padding));
        let rowHeights = rowWeights.map(w => w * (height - 2 * this.padding));

        let xStarts = [this.padding];
        for (let i = 1; i < ctX; i++) {
            xStarts[i] =xStarts[i - 1] + colWidths[i - 1];
        }

        let yStarts = [this.padding];
        for (let j = 1; j < ctY; j++) {
            yStarts[j] = yStarts[j - 1] + rowHeights[j - 1];
        }

        for (let i = 0; i < ctX; i++) {
            for (let j = 0; j < ctY; j++) {
                let x = xStarts[i] + colWidths[i] / 2;
                let y = yStarts[j] + rowHeights[j] / 2;
                this.cells[i][j].updateGeometry(x, y, colWidths[i], rowHeights[j]);
            }
        }

        this.updateShadows();
    }

    updateShadows() {
        let ctX = this.cells.length;
        let ctY = this.cells[0].length;

        for (let i = 0; i < ctX; i++) {
            for (let j = 0; j < ctY - 1; j++) {
                // All cells except the last row can cast shadows on the row below them.
                let currCell = this.cells[i][j];
                for(let k = j + 1; k < ctY; k++) {
                    let belowCell = this.cells[i][k];

                    if(belowCell.modVal > currCell.modVal) {
                        break; // We can't cast shadows through cells that are "taller" than the current
                    }

                    let distY = (belowCell.y - belowCell.tileH / 2) - (currCell.y + currCell.tileH / 2); // Dist between bottom of current cell and top of below cell
                    if(distY > maxShadowDistance) {
                        break; // We can't cast shadows beyond the max shadow distance.
                    } else {
                        let distToMax = maxShadowDistance - distY;
                        let fraction = distToMax / maxShadowDistance;
                        if(fraction > belowCell.shadowCast) {
                            belowCell.shadowCast = fraction;
                        }
                    }                    
                }
            }
        }
    }


    getColumnScores(ctX, ctY) {
        let scores = [];
        for (let i = 0; i < ctX; i++) {
            let total = 0;
            for (let j = 0; j < ctY; j++) {
                // if(this.cells[i][j].modVal < this.minModVal) {
                //     continue;
                // }
                total += this.cells[i][j].modVal;
            }
            scores.push(total / ctY);
        }
        return scores;
    }

    getRowScores(ctX, ctY) {
        let scores = [];
        for (let j = 0; j < ctY; j++) {
            let total = 0;
            for (let i = 0; i < ctX; i++) {
                // if(this.cells[i][j].modVal < this.minModVal) {
                //     continue;
                // }
                total += this.cells[i][j].modVal;
            }
            scores.push(total / ctX);
        }
        return scores;
    }

    makeSoftmaxWeights(scores, count) {
        let temperature = max(this.bandTemperature, 1e-4);
        let uniformMix = constrain(this.bandUniformMix, 0, 1);
        let uniform = 1 / count;

        // Stable softmax: subtract max score before exp to avoid overflow.
        let maxScore = max(scores);
        let expVals = scores.map(s => exp((s - maxScore) / temperature));
        let expSum = max(sum(expVals), 1e-9);
        let softmax = expVals.map(v => v / expSum);

        let mixed = softmax.map(v => lerp(uniform, v, 1 - uniformMix));
        let mixedSum = sum(mixed);
        return mixed.map(v => v / mixedSum);
    }

    *render() {
        // beginRecordSvg(window, 'output.svg');
        // yield;

        let allCells = this.cells.flat();
        allCells = allCells.filter(cell => cell.modVal >= this.minModVal);
        allCells = allCells.sort((a, b) => b.shadowCast - a.shadowCast);

        for(let cell of allCells) {
            cell.getColors();
            cell.renderSurfaceShadow();
        }

        let skipper = 100;
        let ctr = 0;
        for(let cell of allCells) {
            ctr += 1;
            cell.render();

            if(ctr % skipper === 0) yield;
        }
        yield;
    }
}


function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

function initCells(tgtCellDim, padding = 0) {
    let newW = width - 2 * padding;
    let newH = height - 2 * padding;
    let ctX = ceil(newW / tgtCellDim);
    let ctY = ceil(newH / tgtCellDim);
    let cellDimX = newW / ctX;
    let cellDimY = newH / ctY;
    let cells = [];

    for(let i = 0; i < ctX; i++) {
        let row = [];
        for(let j = 0; j < ctY; j++) {
            let x = padding + i * cellDimX + cellDimX / 2;
            let y = padding + j * cellDimY + cellDimY / 2;
            row.push(new SeptCell(x, y, cellDimX, cellDimY, i, j));
        }
        cells.push(row);
    }

    return cells;
}

class SeptCell {
    constructor(x, y, w, h, i, j, modVal) {
        this.updateGeometry(x, y, w, h);
        this.i = i;
        this.j = j;
        this.modVal = modVal;

        this.fauxDepth = true;
        this.shadowCast = 0;

        this.shadowOpacityMax = 0.3;
        this.shadowCol = color(0, 0, 0, 255 * this.shadowOpacityMax);
        this.edgeLightThreshold = 0.05;
        this.edgeShadowThreshold = 0.5;


        this.rimLightIntensity = 1.5;
        this.shadowIntensity = 0.5;
    }

    getColors() {
        let t = this.modVal
        let idxA = (this.i + this.j) % p.size;
        let idxB = floor((idxA + 2 + (t * 3))) % p.size;
        this.baseCol = lerpColor(p.get(idxA), p.get(idxB), t);
        this.baseEdge = this.baseCol;
        this.accentCol = lerpColor(p.get(idxB), p.get(idxA), 0.25 + 0.5 * t);
        this.accentEdge = this.accentCol;

        push();
        colorMode(HSB);
        this.lightBase = color(hue(this.baseCol), saturation(this.baseCol), brightness(this.baseCol) * this.rimLightIntensity);
        this.lightAccent = color(hue(this.accentCol), saturation(this.accentCol), brightness(this.accentCol) * this.rimLightIntensity);
        this.darkBase = color(hue(this.baseCol), saturation(this.baseCol), brightness(this.baseCol) * this.shadowIntensity);
        this.darkAccent = color(hue(this.accentCol), saturation(this.accentCol), brightness(this.accentCol) * this.shadowIntensity);
        pop();

        if(true || random() > 0.5) {
            // Swap colors for edges;

            let tmp = this.lightAccent;
            this.lightAccent = this.lightBase;
            this.lightBase = tmp;

            tmp = this.darkAccent;
            this.darkAccent = this.darkBase;
            this.darkBase = tmp;

            tmp = this.accentEdge;
            this.accentEdge = this.baseEdge;
            this.baseEdge = tmp;
        }



    }

    updateGeometry(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.ctr = [x, y];
        this.dim = min(w, h);

        this.pad = this.dim * 0.15;
        this.tileW = max(2, this.w - this.pad);
        this.tileH = max(2, this.h - this.pad);
        this.corner = min(this.tileW, this.tileH) * 0.2;
    }

    renderSurfaceShadow() {
        let shadowH = this.tileH + this.modVal * maxShadowDistance;

        noStroke();
        fill(bgShadowCol);
        rectMode(CENTER);
        rect(this.ctr[0], this.ctr[1] + shadowH / 2, this.tileW, shadowH, this.corner);
    }

    render() {
        strokeWeight(0.001 * min(width, height));
        rectMode(CENTER);


        // Main shape with outset rim
        fill(this.baseCol);
        stroke(this.baseEdge);
        if(this.shadowCast <= this.edgeLightThreshold) {
            console.log("light edge", this.shadowCast)
            // Outset lit edge
            let t = map(this.shadowCast, 0, this.edgeLightThreshold, 1, 0);
            let lightCol = lerpColor(this.baseCol, this.lightBase, t);
            linearStroke([this.ctr[0], this.ctr[1] - this.tileH / 2], [this.ctr[0], this.ctr[1] + this.tileH / 2], lightCol, this.baseCol);
            // Light on top, normal on bottom
        } else if (this.shadowCast > this.edgeShadowThreshold) {
            // Outset shadowed edge
            let t = map(this.shadowCast, this.edgeShadowThreshold, 1, 0, 1);
            let darkCol = lerpColor(this.baseCol, this.darkBase, t);
            linearStroke([this.ctr[0], this.ctr[1] - this.tileH / 2], [this.ctr[0], this.ctr[1] + this.tileH / 2], this.baseCol, darkCol);
            // normal on top, dark on bottom
            // stroke('red')
        }
        rect(this.ctr[0], this.ctr[1], this.tileW, this.tileH, this.corner);

        // Accent shape with inset rim
        fill(this.accentCol);
        stroke(this.accentEdge);
        if(this.shadowCast <= this.edgeLightThreshold) {
            // Inset lit edge
            let t = map(this.shadowCast, 0, this.edgeLightThreshold, 1, 0);
            let lightCol = lerpColor(this.accentCol, this.lightAccent, t);
            linearStroke([this.ctr[0], this.ctr[1] - this.tileH / 2], [this.ctr[0], this.ctr[1] + this.tileH / 2], this.accentCol, lightCol);
            // Normal on top, light on bottom
        } else if (this.shadowCast > this.edgeShadowThreshold) {
            // Inset shadowed edge
            let t = map(this.shadowCast, this.edgeShadowThreshold, 1, 0, 1);
            let darkCol = lerpColor(this.accentCol, this.darkAccent, t);
            linearStroke([this.ctr[0], this.ctr[1] - this.tileH / 2], [this.ctr[0], this.ctr[1] + this.tileH / 2], darkCol, this.accentCol);
            // Dark on top, normal on bottom
        }
        rect(...this.ctr, this.tileW * 0.66, this.tileH * 0.66, this.corner);

        // Shadow over face of shape

        // Attempt 1: Gradient
        // if(this.shadowCast > 0.01) {
        //     let shadowH = this.tileH * constrain(this.shadowCast, 0, 1);
        //     let startY = this.ctr[1] - this.tileH / 2;
        //     let endY = startY + shadowH;
        //     linearFill([this.ctr[0], startY], [this.ctr[0], endY], this.shadowCol, color(0, 0, 0, 0));
        //     linearStroke([this.ctr[0], startY], [this.ctr[0], endY], this.shadowCol, color(0, 0, 0, 0));
        //     rect(...this.ctr, this.tileW, this.tileH, this.corner);
        // }

        
        // Attempt 2: Flat
        if(this.shadowCast > 0.05) {
            push();
            let shadowH = this.tileH * constrain(this.shadowCast, 0, 1);
            let startY = this.ctr[1] - this.tileH / 2;
            rectMode(CENTER);
            stroke(color(0, 0, 0, 255 * this.shadowOpacityMax * 0.25));
            fill(this.shadowCol);
            
            
            rect(this.ctr[0], startY + shadowH / 2, this.tileW, shadowH, this.corner);
            pop();
        }
        
    }
}