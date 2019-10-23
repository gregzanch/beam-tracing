export default function hash(str: string) {
	var h = 0;
	if (str.length == 0) {
		return h;
	}
	for (var i = 0; i < str.length; i++) {
		var char = str.charCodeAt(i);
		h = ((h << 5) - h) + char;
		h = h & h; // Convert to 32bit integer
	}
	return h;
}
