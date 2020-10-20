/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable func-names */

exports.forEach = async function (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

exports.map = async function (array, callback) {
  const result = [];
  for (let index = 0; index < array.length; index++) {
    const item = await callback(array[index], index, array);
    result.push(item);
  }
  return result;
};
