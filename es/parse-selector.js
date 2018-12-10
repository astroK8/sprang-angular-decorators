export default function (selector) {
    var selectorArray;
    var type;
    if (selector.match(/\[(.*?)\]/) !== null) {
        selectorArray = selector.slice(1, selector.length - 1).split('-');
        type = 'A';
    }
    else if (selector[0] === '.') {
        selectorArray = selector.slice(1, selector.length).split('-');
        type = 'C';
    }
    else {
        selectorArray = selector.split('-');
        type = 'E';
    }
    var first = selectorArray.shift();
    var name;
    if (selectorArray.length > 0) {
        for (var i = 0; i < selectorArray.length; i++) {
            var s = selectorArray[i];
            s = s.slice(0, 1).toUpperCase() + s.slice(1, s.length);
            selectorArray[i] = s;
        }
        name = [first].concat(selectorArray).join('');
    }
    else {
        name = first ? first : '';
    }
    return { name: name, type: type };
}
//# sourceMappingURL=parse-selector.js.map