// 位运算
// 按位与(&)	x & y	每一个比特位都为 1 时，结果为 1，否则为 0
// 按位或(|)	x | y	每一个比特位都为 0 时，结果为 0，否则为 1

//定义常量
const Placement = 0b001; // 0b001
const Update = 0b010; // 0b010
//定义操作
let flags = 0b000;

//增加操作
flags |= Placement;
flags |= Update;
console.log(flags.toString(2));

// 删除操作 0b011
flags = flags & ~Placement; // 0b011 & ~0b001 -> 0b010
console.log(flags.toString(2));

// 判断包含
console.log((flags & Placement) === Placement);
console.log((flags & Update) === Update);

// 判断不包含
console.log((flags & Placement) === 0);
console.log((flags & Update) === 0);
