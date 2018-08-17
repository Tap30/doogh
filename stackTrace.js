/*
 https://github.com/felixge/node-stack-trace/
 */

module.exports.parse = function(err) {
    if (!err.stack) {
        return [];
    }

    let lines = err.stack.split('\n').slice(1);

    return lines
        .map(function(line) {
            if (line.match(/^\s*[-]{4,}$/)) {
                return {
                    fileName: line,
                    lineNumber: null,
                    functionName: null,
                    typeName: null,
                    methodName: null,
                    columnNumber: null,
                    'native': null,
                };
            }

            let lineMatch = line.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?/);
            if (!lineMatch) {
                return;
            }

            let object = null;
            let method = null;
            let functionName = null;
            let typeName = null;
            let methodName = null;
            let isNative = (lineMatch[5] === 'native');

            if (lineMatch[1]) {
                let methodMatch = lineMatch[1].match(/([^\.]+)(?:\.(.+))?/);
                object = methodMatch[1];
                method = methodMatch[2];
                functionName = lineMatch[1];
                typeName = 'Object';
            }

            if (method) {
                typeName = object;
                methodName = method;
            }

            if (method === '<anonymous>') {
                methodName = null;
                functionName = '';
            }

            let properties = {
                fileName: lineMatch[2] || null,
                lineNumber: parseInt(lineMatch[3], 10) || null,
                functionName: functionName,
                typeName: typeName,
                methodName: methodName,
                columnNumber: parseInt(lineMatch[4], 10) || null,
                'native': isNative,
            };

            return properties;
        })
        .filter(function(callSite) {
            return !!callSite;
        });
};

