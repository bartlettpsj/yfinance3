// Flatten any nested object into dot.notation keys

// console.tableDeep wrapper
// @ts-ignore
// console.tableDeep = function (data) {
//     if (!Array.isArray(data)) {
//         // Wrap single object into array
//         data = [data];
//     }
//     const flattened = data.map(item => flattenObject(item));
//     console.table(flattened);
// };

export function tableDeep (data: any) {
    function flattenObject(obj: object, prefix = '') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(acc, flattenObject(value, newKey));
            } else {
                // @ts-ignore
                acc[newKey] = value;
            }
            return acc;
        }, {});
    }

    if (!Array.isArray(data)) {
        // Wrap single object into array
        data = [data];
    }
    const flattened = data.map((item: any) => flattenObject(item));
    console.table(flattened);
}


// export default {}
