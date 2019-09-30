function Queue() {
  var data = [];

  this.clear = function () {
    data.length = 0;
  };

  this.getLength = function () {
    return data.length;
  };

  this.isEmpty = function () {
    return data.length === 0;
  };

  this.enqueue = function (item) {
    data.push(item);
  };

  this.dequeue = function () {
    if (data.length === 0) return undefined;
    return data.shift();
  };

  this.peek = function () {
    return data.length > 0 ? data[0] : undefined;
  };
}
