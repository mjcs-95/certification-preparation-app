/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.storage = {
    read(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    },
    write(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            return false;
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            return false;
        }
    },
};
