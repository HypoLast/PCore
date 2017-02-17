let fs = require("fs");

let obj = JSON.parse(fs.readFileSync(process.argv[2]));
let dim = [obj.width, obj.height];
let boxes = obj.layers.filter(e => e.name == "terrain")[0].objects;
let cells = new Array(dim[0]).fill(0).map(() => new Array(dim[1]).fill(0));
for (let box of boxes) {
	for (let i = box.x / 16; i < box.x / 16 + box.width / 16; i ++) {
		for (let j = box.y / 16; j < box.y / 16 + box.height / 16; j ++) {
			cells[i][j] = 1;
		}
	}
}
let gold = obj.layers.filter(e => e.name == "gold")[0].objects;
for (let box of gold) {
	for (let i = box.x / 16; i < box.x / 16 + box.width / 16; i ++) {
		for (let j = box.y / 16; j < box.y / 16 + box.height / 16; j ++) {
			cells[i][j] = 2;
		}
	}
}
let start = [obj.properties.startX, obj.properties.startY];
console.log(JSON.stringify({
	cells,
	dim,
	start
}));