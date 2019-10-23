export function transpose(array) {
	var newArray = [];
	for (var i = 0; i < array.length; i++) {
		newArray.push([]);
	};

	for (var i = 0; i < array.length; i++) {
		for (var j = 0; j < array[i].length; j++) {
			newArray[j].push(array[i][j]);
		};
	};

	return newArray.filter(x=>x.length>0);
}
