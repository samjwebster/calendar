let segId = 0, shapeStep;
let mf;
let config;

function initConfig() {
    config = {
        qtRMult: 0.9, // random(0.90, 1.10),

        doMinSizeFilter: random([true, false]),
        doMaxSizeFilter: random([true, false]),
        doRandomFilter: random([true, false]),

        segmentColorMode: random(["phase", "idPhase"]),
        segmentAccentMode: random(["mod", "noise", "phase", "idPhase"]),
    }
}

class November {
    constructor() {
        // Setup
        initConfig();
        p = new NovPalette("rampensau", 1, novRampensauColors(round(random(3, 6))));
    }

    initialize() {
        mf = modfield.generateRandomFieldGroup({
            w: width,
            h: height,
            fieldOptions: {fieldTypes: ["line"]}
        });

        shapeStep = (min(width, height) / 200) * random(0.60, 0.90);
        segId = 0;

        let numShapes = round(random(4, 8));
        this.renderShapes = [];
        this.maxShapeSize = 0;
        while(this.renderShapes.length < numShapes) {
            let option = random(["line", "bezier", "polygon", "ellipse"]);
            let shapes = [];
            if(option == "line") {
                shapes.push(makeRandomLine());
            } else if(option == "bezier") {
                shapes.push(makeRandomBezier());
            } else if(option == "ellipse") {
                shapes.push(makeRandomEllipse());
            } else {
                shapes.push(makeRandomPolygon(round(random(3, 8))));
            }

            if(random() < 0.20) {
                let reflectedShape = makeSymmetric(shapes[0]);
                shapes.push(reflectedShape);
            } else if (random() < 0.20) {
                let pivot = [
                    random(0.25, 0.75) * width,
                    random(0.25, 0.75) * height
                ];
                let count = random([2, 3, 5, 7])
                shapes = [...shapes, ...makeNRotations(shapes[0], pivot, count)];
            }

            for(let s of shapes) {
                this.maxShapeSize = max(this.maxShapeSize, s.size);
                this.renderShapes.push(s);
            }      
        }

        this.qt = new QuadTree(new Rectangle(width/2, height/2, width * 1.25, height * 1.25), 4);

        this.calculate();

    }

    calculate() {
        this.renderSegs = [];

        while(this.renderShapes.length > 0) {
            let newRenderShapes = [];
            while(this.renderShapes.length > 0) {
                let renderShape = this.renderShapes.pop();

                let finished = renderShape.update();
                if(!finished) {
                    newRenderShapes.push(renderShape);
                }

                let currId = segId;
                let segData = {
                    id: currId,
                    size: renderShape.size,
                    iter: renderShape.iters,
                    phase: renderShape.phase,
                    xRange: renderShape.xRange,
                    yRange: renderShape.yRange
                }
                segId += 1;
                let currSeg = [];
                for(let i = 0; i < renderShape.segments.length; i++) {
                    let seg = renderShape.segments[i];
                    let data = {
                        size: renderShape.size,
                        xRange: renderShape.xRange,
                        yRange: renderShape.yRange
                    };

                    let result = this.addSegmentToQt(seg, currId, data);

                    if(result) {
                        currSeg.push(seg);
                    } else if (currSeg.length > 0) {
                        this.renderSegs.push(new RenderSegment(currSeg, currId, segData));
                        currSeg = [];
                    }
                }
                if(currSeg.length > 0) {
                    this.renderSegs.push(new RenderSegment(currSeg, currId, segData));
                }
                
            }
            this.renderShapes = newRenderShapes;
        }
        
        if(config.doMinSizeFilter || config.doMaxSizeFilter) {
            let avgRenderSegLength = this.renderSegs.reduce((acc, seg) => acc + seg.length, 0) / this.renderSegs.length;
            let lowerThreshold = config.doMinSizeFilter ? random() < 0.50 ? 0 : avgRenderSegLength * random(0.25, 0.75) : 0;
            let upperThreshold = config.doMaxSizeFilter ? random() < 0.5 ? Infinity : avgRenderSegLength * random(6, 12) : Infinity;
            this.renderSegs = this.renderSegs.filter((seg) => seg.length >= lowerThreshold && seg.length <= upperThreshold);
        }

        if(config.doRandomFilter) {
            let removeChance = random(0.025, 0.1);
            this.renderSegs = this.renderSegs.filter((seg) => random() > removeChance);
        }
    }

    inQt(pt) {
        return this.qt.inBounds(pt[0], pt[1]);
    }

    addSegmentToQt(seg, id, data) {
        if(!isOnScreen(seg[0]) && !isOnScreen(seg[1])) return false;

        if(!this.inQt(seg[0]) || !this.inQt(seg[1])) return false;

        if(!valInRange(seg[0][0], data.xRange) || !valInRange(seg[1][0], data.xRange)) return false;
        if(!valInRange(seg[0][1], data.yRange) || !valInRange(seg[1][1], data.yRange)) return false;

        let ctr = [
            (seg[0][0] + seg[1][0]) / 2,
            (seg[0][1] + seg[1][1]) / 2
        ];

        data.seg = seg;

        let r = this.maxShapeSize * config.qtRMult;

        let query = new Circle(ctr[0], ctr[1], r);
        let found = this.qt.query(query);

        let nBeforeFilter = found.length;
        found = found.filter(p => p.id != id);
        let nAfterFilter = found.length;

        // Too many segments of the same id in the area
        if(nBeforeFilter - nAfterFilter > 8) return false;
        
        if(found.length) {
            for(let p of found) {
                let otherSeg = p.data;
                let d = dist(ctr[0], ctr[1], p.x, p.y);
                if (d <= data.size + otherSeg.size) {
                    return false;
                }
            }
        }
        

        // insert a point at center and each endpoint
        this.qt.insert({
            x: ctr[0],
            y: ctr[1],
            id: id,
            data: data
        });
        this.qt.insert({
            x: seg[0][0],
            y: seg[0][1],
            id: id,
            data: "don't render"
        });
        this.qt.insert({
            x: seg[1][0],
            y: seg[1][1],
            id: id,
            data: "don't render"
        });

        return true;
    }

    renderSegmentShadows() {
        let sg = createGraphics(width, height); // shadow graphic
        sg.clear();

        sg.strokeWeight(shapeStep);
        sg.noFill();
        sg.stroke(color(0));

        for(let s of this.renderSegs) {
            sg.beginShape();
            for (let p of s.pts) {
                sg.vertex(p[0], p[1]);
            }
            sg.endShape();
        }

        sg.fill(0);
        sg.stroke(0);
        sg.erase(150, 150);
        sg.rect(0, 0, width, height);
        sg.noErase();

        let blurAmt = str(ceil(0.01 * min(width, height)));
        drawingContext.filter = `blur(${blurAmt}px)`;
        image(sg, 0, 0, width, height);
        drawingContext.filter = 'none';
    }

    renderSolidBg(dark=null) {
        let bgCol = p.r();
        colorMode(HSB);
        let l;
        if(dark != null) {
            l = dark ? 12 : 85;
        } else {
            l = random([12, 85]);
        }
        background(color(hue(bgCol), saturation(bgCol) * random(0.125, 0.40), l));
        colorMode(RGB);
        // background("#BAB1B6") 
    }

    *renderSketchy() {

        this.renderSegmentShadows();
        yield;

        for(let s of this.renderSegs) {
            s.render();
            yield;
        }
    }

    *render() {
        let skipper = 75;
        let ctr = 0;
        let doCt = () => {
            ctr += 1;
            return ctr % skipper == 0;
        }

        this.renderSolidBg();
        yield;

        this.initialize();

        for(let _ of this.renderSketchy()) {
            if(doCt()) yield;
        }

        return;
    }
}

class RenderSegment {
    constructor(segs, id, data) {
        this.pts = [];
        this.ctr = [0,0]
        for(let s of segs) {
            this.pts.push(s[0]);
            this.ctr[0] += s[0][0];
            this.ctr[1] += s[0][1];
        }
        this.pts.push(segs[segs.length - 1][1]);
        this.ctr[0] /= this.pts.length;
        this.ctr[1] /= this.pts.length;

        this.length = segs.length;
        this.id = id;

        let nDetail = 8;
        this.n = noise(this.ctr[0] / min(width, height) * nDetail, this.ctr[1] / min(width, height) * nDetail);
        this.modval = mf.mod(this.ctr);
        this.size = data.size;
        this.iter = data.iter;
        this.phase = data.phase;


        let t;
        if(config.segmentColorMode == "phase") {
            t = (this.iter % this.phase) / this.phase;
        } else if(config.segmentColorMode == "idPhase") {
            t = (this.id % p.colors.length) / p.colors.length;
        }
        this.col = wobbleCol(p.getFloat(t));

        if(config.segmentAccentMode == "mod") {
            t = this.modval;
        } else if(config.segmentAccentMode == "noise") {
            t = this.n;
        } else if(config.segmentAccentMode == "phase") {
            t = (this.iter % this.phase) / this.phase;
        } else if(config.segmentAccentMode == "idPhase") {
            t = (this.id % p.colors.length) / p.colors.length;
        }
        t = 1 - t;
        this.accent = wobbleCol(p.getFloat(t));

        let tmp = this.col;
        this.col = this.accent;
        this.accent = tmp;

        this.bandVerts = [];
        this.computeBand();
    }

    render() {
        this.renderSketchy();
    }

    renderSketchy() {
        drawSketchyPolygon(this.bandVerts, this.col, this.accent);
    }

    computeBand() {
        let leftAngles = [];
        let rightAngles = [];
        for(let i = 0; i < this.pts.length - 1; i++) {
            let vecA = createVector(...this.pts[i]);
            let vecB = createVector(...this.pts[i + 1]);
            let dirBetween = p5.Vector.sub(vecB, vecA);
            let rotatedLeft = dirBetween.copy().rotate(-HALF_PI).normalize();
            leftAngles.push(rotatedLeft);
            let rotatedRight = dirBetween.copy().rotate(HALF_PI).normalize();
            rightAngles.push(rotatedRight);
        }
        leftAngles.push(leftAngles[leftAngles.length - 1]);
        rightAngles.push(rightAngles[rightAngles.length - 1]);

        let dim = min(width, height);
        let det = 64;
        let nAtPos = (p) => {
            p = [(p[0]/dim) * det, (p[1]/dim) * det, (this.iter / this.phase) * det];
            return noise(...p);
        }

        let maxOffset = this.size;
        let leftEdge = [];
        let rightEdge = [];

        for(let i = 0; i < this.pts.length; i++) {
            let p = this.pts[i];

            let n = nAtPos(p);
            let offset = maxOffset * lerp(0.20, 1.0, n);

            leftEdge.push([
                p[0] + leftAngles[i].x * offset,
                p[1] + leftAngles[i].y * offset
            ]);
            rightEdge.push([
                p[0] + rightAngles[i].x * offset,
                p[1] + rightAngles[i].y * offset
            ]);
        }
        this.leftEdge = leftEdge;
        this.rightEdge = rightEdge;
        this.bandVerts = leftEdge.concat(rightEdge.slice().reverse());
    }


}


function drawSketchyPolygon(pts, fillCol, strokeCol) {
    noStroke();
    fill(fillCol);
    beginShape();
    for(let p of pts) {
        vertex(...p);
    }
    endShape(CLOSE);

    let strokeColOptions = [];
    let nStrokeCols = 5;
    for(let i = 0; i < nStrokeCols; i++) {
        let opacity = 0.25 + 0.25 * (i/(nStrokeCols-1));
        strokeColOptions.push(color(red(strokeCol), green(strokeCol), blue(strokeCol), opacity * 255));
    }

    let strokeRRange = [
        0.25 * shapeStep,
        0.50 * shapeStep
    ];

    let strokeOffsetStd = 0.125 * shapeStep;

    let substep = 0.125 * shapeStep;
    for(let i = 0; i < pts.length; i++) {
        let a = pts[i];
        let b = pts[(i + 1) % pts.length];
        let subpts = ptsAB(a, b, substep);
        for(let j = 0; j < subpts.length - 1; j++) {
            let pt = subpts[j];
            let offsetAmount = randomGaussian(0, strokeOffsetStd);
            let offsetAngle = random(TAU);

            pt[0] += cos(offsetAngle) * offsetAmount;
            pt[1] += sin(offsetAngle) * offsetAmount;

            if(!isOnScreen(pt)) continue;

            fill(random(strokeColOptions));
            circle(...pt, random(...strokeRRange));
        }
    }
} 

function valInRange(val, range) {
    return val >= range[0] && val <= range[1];
}

function isOnScreen(pt, padding = 0) {
    return pt[0] >= padding &&
        pt[0] <= width - padding &&
        pt[1] >= padding &&
        pt[1] <= height - padding;
}

function ptsAB(a, b, step) {
    let distance = dist(a[0], a[1], b[0], b[1]);
    let count = max(1, ceil(distance / step));
    let pts = [];
    for(let i = 0; i <= count; i++) {
        pts.push(lerpPos(a, b, i / count));
    }
    return pts;
}

class ShiftShape {
    constructor(vertTuples, closed=false) {
        this.type = "line";
        this.vertTuples = vertTuples;
        this.size = random(0.75, 3.0) * shapeStep;
        this.t = 0;

        this.maxIters = 0;
        for(let [a, b] of vertTuples) {
            this.maxIters += dist(...a, ...b) / shapeStep;
        }
        // Average number of sizes we can fit between pairs
        this.maxIters = ceil(this.maxIters / this.vertTuples.length);

        this.iters = 0;

        this.phase = round(random(1, 10));
        this.closed = closed;
        this.segments = [];

        let paddingDim = min(width, height);
        // this.xRange = [random(-0.2, 0.3) * paddingDim, width + random(-0.3, 0.2) * paddingDim];
        // this.yRange = [random(-0.2, 0.3) * paddingDim, height + random(-0.3, 0.2) * paddingDim];

        let amt = () => random(0.05, 0.15) * paddingDim;

        this.xRange = [amt(), width - amt()];
        this.yRange = [amt(), height - amt()];

        // this.padding = random() < 0.5 ?
        //     -0.1 * min(width, height) : // offscreen
        //     random(0.05, 0.15) * min(width, height); // on-screen

        this.updateSegments();
    }

    inBounds(x, y) {
        return valInRange(x, this.xRange) && valInRange(y, this.yRange);
    }

    updateSegments() {
        let segs = [];

        let iterPairs = [];

        if(!this.closed) {
            for(let i = 0; i < this.vertTuples.length - 1; i++) {
                let posA = lerpPos(...this.vertTuples[i], this.t);
                let posB = lerpPos(...this.vertTuples[i + 1], this.t);
                iterPairs.push([posA, posB]);
            }
        } else {
            for(let i = 0; i < this.vertTuples.length; i++) {
                let posA = lerpPos(...this.vertTuples[i], this.t);
                let posB = lerpPos(...this.vertTuples[(i + 1) % this.vertTuples.length], this.t);
                iterPairs.push([posA, posB]);
            }
        }

        for(let [posA, posB] of iterPairs) {
            let d = dist(posA[0], posA[1], posB[0], posB[1]);
            let ct = ceil(d / shapeStep);
            for(let j = 0; j < ct; j++) {
                let t = j / ct;
                let t1 = (j + 1) / ct;
                let a = lerpPos(posA, posB, t);
                let b = lerpPos(posA, posB, t1);
                segs.push([a, b]);
            }
        }

        this.segments = segs;
    }

    update() {
        this.t = constrain(this.iters/this.maxIters, 0, 1);
        this.updateSegments();
        this.iters++;
        if (this.iters > this.maxIters + 1) return true;
    }
}

class ShiftBezier extends ShiftShape {
    constructor(vertPairs, size) {
        super(vertPairs, size); // [anchor1, control1, control2, anchor2]
        this.type = "bezier";
    }

    updateSegments() {
        let anchor1 = lerpPos(...this.vertTuples[0], this.t);
        let control1 = lerpPos(...this.vertTuples[1], this.t);
        let control2 = lerpPos(...this.vertTuples[2], this.t);
        let anchor2 = lerpPos(...this.vertTuples[3], this.t);

        let dApprox = dist(...anchor1, ...control1) + dist(...control1, ...control2) + dist(...control2, ...anchor2);
        dApprox *= 0.75;
        let ct = ceil(dApprox / shapeStep);

        let pts = [];
        for(let i = 0; i <= ct; i++) {
            let t = i / ct;
            let x = bezierPoint(anchor1[0], control1[0], control2[0], anchor2[0], t);
            let y = bezierPoint(anchor1[1], control1[1], control2[1], anchor2[1], t);
            if(i > 0 && dist(...pts[pts.length - 1], x, y) < 0.5 * shapeStep) continue; // avoid super dense curves
            pts.push([x, y]);
        }

        let segs = [];
        for(let i = 0; i < pts.length - 1; i++) {
            segs.push([pts[i], pts[i + 1]]);
        }

        this.segments = segs;
    }
}

class ShiftPolygon extends ShiftShape {
    constructor(vertTuples) {
        super(vertTuples, true);
        this.type = "polygon";
    }
}

function randPosNearPos(pos, amt) {
    let a = random()*TAU;
    let r = random(0.5, 1) * amt;
    let x = pos[0] + cos(a) * r;
    let y = pos[1] + sin(a) * r;
    return [x, y];
}

function randomOffOnPts(backsetAmt = 0.5) {
    let offscreenPoints = [
        [-backsetAmt * width, random() * height],
        [(1 + backsetAmt) * width, random() * height],
        [random() * width, -backsetAmt * height],
        [random() * width, (1 + backsetAmt) * height]
    ];
    offscreenPoints = shuffleArray(offscreenPoints);
    if(random() < 0.25) {
        let a = random([0, 1, 2, 3]);
        let b = random([0, 1, 2, 3].filter(i => i != a));
        if(random() < 0.5) {
            offscreenPoints[b][0] = offscreenPoints[a][0];
        } else {
            offscreenPoints[b][1] = offscreenPoints[a][1];
        }
    }

    let onscreenPoints = [
        [random(0, 0.5) * width, random(0, 0.5) * height],
        [random(0.5, 1) * width, random(0, 0.5) * height],
        [random(0, 0.5) * width, random(0.5, 1) * height],
        [random(0.5, 1) * width, random(0.5, 1) * height]
    ];
    onscreenPoints = shuffleArray(onscreenPoints);
    if(random() < 0.25) {
        let a = random([0, 1, 2, 3]);
        let b = random([0, 1, 2, 3].filter(i => i != a));
        if(random() < 0.5) {
            onscreenPoints[b][0] = onscreenPoints[a][0];
        } else {
            onscreenPoints[b][1] = onscreenPoints[a][1];
        }
    }

    return [offscreenPoints, onscreenPoints];
}

function makeRandomLine() {
    
    let offscreenPoints, onscreenPoints;
    [offscreenPoints, onscreenPoints] = randomOffOnPts();
    let d = min(width, height);

    let aPair = [offscreenPoints[0], randPosNearPos(random([offscreenPoints[0], random(onscreenPoints)]), d)];
    if(random() < 0.5) aPair = aPair.reverse();

    let bPair = [offscreenPoints[1], randPosNearPos(random([offscreenPoints[1], random(onscreenPoints)]), d)];
    if(random() < 0.5) bPair = bPair.reverse();

    return new ShiftShape([aPair, bPair], false);
}

function makeRandomBezier() {
    let offscreenPoints, onscreenPoints;
    [offscreenPoints, onscreenPoints] = randomOffOnPts();

    let anchor1 = [offscreenPoints[0], offscreenPoints[1]];
    let anchor2 = [offscreenPoints[2], offscreenPoints[3]];

    let chance = 0.75;
    if(random() < chance) {
        let i = random([0, 1]);
        anchor1[i] = random(onscreenPoints);
        chance *= 0.5;
    }
    if(random() < chance) {
        let i = random([0, 1]);
        anchor2[i] = random(onscreenPoints);
    }

    let d = min(width, height);
    let controlT = 0.1
    let control1 = [
        randPosNearPos(lerpPos(anchor1[0], anchor2[0], controlT), d),
        randPosNearPos(lerpPos(anchor1[1], anchor2[1], controlT), d)
    ];

    let control2 = [
        randPosNearPos(lerpPos(anchor1[0], anchor2[0], 1-controlT), d),
        randPosNearPos(lerpPos(anchor1[1], anchor2[1], 1-controlT), d)
    ];

    return new ShiftBezier([anchor1, control1, control2, anchor2]);
}

function makeRandomPolygon(numVerts) {
    
    let sizeRange = [0.45, 0.90];
    let sizeA = random(...sizeRange) * min(width, height);
    let sizeB = sizeA / random(2.5, 4.0);

    let center = [random(0.2, 0.8) * width, random(0.2, 0.8) * height];

    let aOffset = random() * TAU;
    let swap = random() < 0.5;

    let vertPairs = [];

    for(let i = 0; i < numVerts; i++) {
        let t = i / numVerts;
        let t1 = (i+1) / numVerts;
        let aRange = [
            aOffset + t * TAU,
            aOffset + t1 * TAU
        ];

        let a = random(...aRange);
        let rA = random(0.75, 1.25) * sizeA;
        let rB = random(0.75, 1.25) * sizeB;

        let posA = [
            center[0] + cos(a) * rA,
            center[1] + sin(a) * rA
        ];

        let posB = [
            center[0] + cos(a) * rB,
            center[1] + sin(a) * rB
        ];
        
        if(swap) {
            vertPairs.push([posB, posA]);
        } else {
            vertPairs.push([posA, posB]);
        }
    }

    return new ShiftPolygon(vertPairs);
}

function makeRandomEllipse() {
    let sizeA = random(0.45, 0.90) * min(width, height);
    let sizeB = sizeA / random(2.5, 4.0);

    let center = [random(0.2, 0.8) * width, random(0.2, 0.8) * height];

    let rModXA = random(0.75, 1.5);
    let rModYA = random(0.75, 1.5);
    let rModXB = random(0.75, 1.5);
    let rModYB = random(0.75, 1.5);

    let numVerts = max(sizeA, sizeB) / shapeStep * 3;

    let aOffset = random() * TAU;

    let vertPairs = [];

    for(let i = 0; i < numVerts; i++) {
        let t = i / numVerts;

        let a = aOffset + t * TAU;

        let posA = [
            center[0] + cos(a) * sizeA * rModXA,
            center[1] + sin(a) * sizeB * rModYA
        ];

        let posB = [
            center[0] + cos(a) * sizeA * rModXB,
            center[1] + sin(a) * sizeB * rModYB
        ];

        vertPairs.push([posA, posB]);
    }

    return new ShiftPolygon(vertPairs);
}

function reflectPointAcrossLine(pt, linePt, angle) {
    // Reflects a point across a line defined by a point and an angle (in radians)
    let dx = pt[0] - linePt[0];
    let dy = pt[1] - linePt[1];

    let cosA = cos(angle);
    let sinA = sin(angle);

    let xRot = cosA * dx + sinA * dy;
    let yRot = -sinA * dx + cosA * dy;

    let yRotReflected = -yRot;

    let xFinal = cosA * xRot - sinA * yRotReflected + linePt[0];
    let yFinal = sinA * xRot + cosA * yRotReflected + linePt[1];

    return [xFinal, yFinal];
}

function randomlyReflectPairs(vertTuples) {
    let center = [random(0.2, 0.8) * width, random(0.2, 0.8) * height];
    let angle = random(TAU);

    let reflectedVertTuples = vertTuples.map((tuple) => {
        let a = reflectPointAcrossLine(tuple[0], center, angle);
        let b = reflectPointAcrossLine(tuple[1], center, angle);
        return [a, b];
    });

    return reflectedVertTuples;
}

function makeSymmetric(shape) {
    let reflectedTuples = randomlyReflectPairs(shape.vertTuples);
    if(shape.type === "line") {
        return new ShiftShape(reflectedTuples, shape.closed);
    } else if(shape.type === "bezier") {
        return new ShiftBezier(reflectedTuples);
    } else if(shape.type === "polygon") {
        return new ShiftPolygon(reflectedTuples);
    }
}

function makeNRotations(shape, pivot, n) {
    n = round(n);
    if(n < 1) return [];

    let angleStep = TAU / n;

    let rotatedShapes = [];

    for(let i = 1; i < n; i++) {
        let angleOffset = i * angleStep;
        let rotatedVertTuples = shape.vertTuples.map((tuple) => {
            return tuple.map((point) => {
                let dx = point[0] - pivot[0];
                let dy = point[1] - pivot[1];
                let cosAngle = cos(angleOffset);
                let sinAngle = sin(angleOffset);

                return [
                    pivot[0] + dx * cosAngle - dy * sinAngle,
                    pivot[1] + dx * sinAngle + dy * cosAngle
                ];
            });
        });
        if(shape.type === "line") {
            rotatedShapes.push(new ShiftShape(rotatedVertTuples, shape.closed));
        } else if(shape.type === "bezier") {
            rotatedShapes.push(new ShiftBezier(rotatedVertTuples));
        } else if(shape.type === "polygon") {
            rotatedShapes.push(new ShiftPolygon(rotatedVertTuples));
        }
    }

    return rotatedShapes;
}

class QuadTree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;
    
        let ne = new Rectangle(x + w, y - h, w, h);
        this.northeast = new QuadTree(ne, this.capacity);
        let nw = new Rectangle(x - w, y - h, w, h);
        this.northwest = new QuadTree(nw, this.capacity);
        let se = new Rectangle(x + w, y + h, w, h);
        this.southeast = new QuadTree(se, this.capacity);
        let sw = new Rectangle(x - w, y + h, w, h);
        this.southwest = new QuadTree(sw, this.capacity);
    
        this.divided = true;
    }

    insert(point) {
        if (!this.boundary.contains(point)) {
          return false;
        }
    
        if (this.points.length < this.capacity) {
          this.points.push(point);
          return true;
        }
    
        if (!this.divided) {
          this.subdivide();
        }
    
        if (this.northeast.insert(point) || this.northwest.insert(point) ||
          this.southeast.insert(point) || this.southwest.insert(point)) {
          return true;
        }
    }

    query(range, found=[]) {    
        if (!range.intersects(this.boundary)) {
          return found;
        }
    
        for (let p of this.points) {
          if (range.contains(p)) {
            found.push(p);
          }
        }
        if (this.divided) {
          this.northwest.query(range, found);
          this.northeast.query(range, found);
          this.southwest.query(range, found);
          this.southeast.query(range, found);
        }
    
        return found;
    }

    inBounds(x, y) {
        return this.boundary.contains({x: x, y: y});
    }

}

// circle class for a circle shaped query
class Circle {
    constructor(x, y, r) {
      this.x = x;
      this.y = y;
      this.r = r;
      this.rSquared = this.r * this.r;
    }
  
    contains(point) {
      // check if the point is in the circle by checking if the euclidean distance of
      // the point and the center of the circle if smaller or equal to the radius of
      // the circle
      let d = Math.pow((point.x - this.x), 2) + Math.pow((point.y - this.y), 2);
      return d <= this.rSquared;
    }
  
    intersects(range) {
  
      var xDist = Math.abs(range.x - this.x);
      var yDist = Math.abs(range.y - this.y);
  
      // radius of the circle
      var r = this.r;
  
      var w = range.w;
      var h = range.h;
  
      var edges = Math.pow((xDist - w), 2) + Math.pow((yDist - h), 2);
  
      // no intersection
      if (xDist > (r + w) || yDist > (r + h))
        return false;
  
      // intersection within the circle
      if (xDist <= w || yDist <= h)
        return true;
  
      // intersection on the edge of the circle
      return edges <= this.rSquared;
    }
}

class Rectangle {
    constructor(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
  
    contains(point) {
      return (point.x >= this.x - this.w &&
        point.x <= this.x + this.w &&
        point.y >= this.y - this.h &&
        point.y <= this.y + this.h);
    }
  
  
    intersects(range) {
      return !(range.x - range.w > this.x + this.w ||
        range.x + range.w < this.x - this.w ||
        range.y - range.h > this.y + this.h ||
        range.y + range.h < this.y - this.h);
    }
}

class NovPalette {
    constructor(name,level,colors) {
        this.name = name;
        this.level = level;
        this.colors = colors;
        this.size = colors.length;
    }

    getFloat(t, interpolate = false) {
        if(interpolate) {
            t = constrain(t, 0, 1);
            let i = floor(t * (this.size - 1));
            let j = (i + 1) % this.size;
            let f = (t * (this.size - 1)) % 1;
            return lerpColor(this.colors[i], this.colors[j], f);
        } else {
            let i = floor(t * (this.size - 1));
            return this.colors[i];
        }
    }

    r() {
        return this.colors[this.getRandomIndex()];
    }

    getRandomIndex() {
        return floor(random()*this.size);
    }

}

function novRampensauColors(n = 10) {
    let sRange = [0.50, 0.90];

    let lRange = [random(0.05, 0.95), random(0.05, 0.95)];
    while(abs(lRange[0] - lRange[1]) < 0.50) { lRange = [random(0.05, 0.95), random(0.05, 0.95)]; }

    let hEasing = randomEasingFunction();
    let sEasing = randomEasingFunction();
    let lEasing = randomEasingFunction();

    let hueList = rampensau.utils.scaleSpreadArray(
        rampensau.colorUtils.colorHarmonies.splitComplementary(random() * 360),
        n,
        0,
        rampensau.utils.lerpHue
    );

    // console.log("hueList", hueList);

    let colors = rampensau.generateColorRamp({
        hueList: hueList,
        
        // hCycles: hCycles,
        sRange: sRange,
        lRange: lRange,

        sEasing: (x) =>
          x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
        lEasing: 
            (x) => -(Math.cos(Math.PI * x) - 1) / 2,
        hEasing: hEasing,
        sEasing: sEasing,
        lEasing: lEasing,
        total: n,
    });

    push();
    colorMode(HSB);
    colors = colors.map(c => color(c[0], c[1] * 100, c[2] * 100));
    pop();


    let randomRotateIndex = floor(random(0, colors.length));
    colors = [...colors.slice(randomRotateIndex), ...colors.slice(0, randomRotateIndex)];


    // console.log("colors", colors);
    return colors;
}

function randomEasingFunction() {
    let easingFunctions = [
        (x) => x, // Linear
        (x) => 1 - Math.cos((x * Math.PI) / 2), // Ease In Sine
        (x) => Math.sin((x * Math.PI) / 2), // Ease Out Sine
        (x) => -(Math.cos(Math.PI * x) - 1) / 2, // Ease In Out Sine
        (x) => x * x, // Ease In Quad
        (x) => 1 - (1 - x) * (1 - x), // Ease Out Quad
        (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2, // Ease In Out Quad
        (x) => x * x * x, // Ease In Cubic
        (x) => 1 - Math.pow(1 - x, 3), // Ease Out Cubic
        (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, // Ease In Out Cubic
        (x) => x * x * x * x, // Ease In Quart
        (x) => 1 - Math.pow(1 - x, 4), // Ease Out Quart
        (x) => x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2, // Ease In Out Quart
        (x) => x * x * x * x * x, // Ease In Quint
        (x) => 1 - Math.pow(1 - x, 5), // Ease Out Quint
        (x) => x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2, // Ease In Out Quint
        (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)), // Ease In Expo
        (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)), // Ease Out Expo
        (x) => {
          if (x === 0) {
            return 0;
          }
          if (x === 1) {
            return 1;
          }
          if (x < 0.5) {
            return Math.pow(2, 20 * x - 10) / 2;
          }
          return (2 - Math.pow(2, -20 * x + 10)) / 2;
        }, // Ease In Out Expo
        (x) => 1 - Math.sqrt(1 - Math.pow(x, 2)), // Ease In Circ
        (x) => Math.sqrt(1 - Math.pow(x - 1, 2)), // Ease Out Circ
        (x) => x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2, // Ease In Out Circ
        (x, fr) => x + (-fr + Math.random() * fr * 2) * 0.5, // Relative Random 50,
        (x) => Math.random(), // Random
    ];
    return random(easingFunctions);
}