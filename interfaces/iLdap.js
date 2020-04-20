'use strict';
//const BASE = global.BASE;
const C = global.config;
//const L = global.logger;
//const K = global.constants;

// Externo
const ActiveDirectory = require('activedirectory');
const clone = require('clone');

const autenticar = (txId, authReq, callback) => {

    var ldapConfig = clone(C.ldap);
    ldapConfig.baseDN = 'DC=hefame,DC=es';
    ldapConfig.username = authReq.domain + '\\' + authReq.username;
    ldapConfig.password = authReq.password;

    var ad = new ActiveDirectory(ldapConfig);

    ad.authenticate(ldapConfig.username, ldapConfig.password, (authErr, authResult) => {
        if (authErr) {
            callback(authErr);
            return;
        }

        ad.getGroupMembershipForUser(authReq.username, (ldapError, groups) => {
            if (ldapError || !groups || !groups.forEach) {
                callback(ldapError);
                return;
            }

            var grupos = [];
            groups.forEach((group) => {
                if (group.cn.startsWith('FED3_'))
                    grupos.push(group.cn);
            });

            callback(null, grupos);

        })
    });
}

module.exports = {
    autenticar
}
