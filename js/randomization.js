/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.randomization = {
    shuffle(items, random = Math.random) {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    },
    shuffledIds(items, previousIds = []) {
        let ids = this.shuffle(items.map((item) => item.id));
        if (ids.length > 1 && ids.every((id, index) => id === previousIds[index])) {
            [ids[0], ids[1]] = [ids[1], ids[0]];
        }
        return ids;
    },
    sameSet(left, right) {
        return left.length === right.length && left.every((value) => right.includes(value));
    },
};
