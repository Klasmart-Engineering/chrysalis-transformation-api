export const arraysMatch = (
  arr1: Array<string | number>,
  arr2: Array<string | number>,
): boolean => {
    const sortedArr1 = arr1.sort();
    const sortedArr2 = arr2.sort();

	if (sortedArr1.length !== sortedArr2.length) return false;

	for (let i = 0; i < sortedArr1.length; i++) {
		if (sortedArr1[i] !== sortedArr2[i]) return false;
	}

	return true;
};