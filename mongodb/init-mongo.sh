#!/usr/bin/env bash

echo "[+] Creating flag_x for XS-Leaks.";

flag_x=$(base64 <<< "cnss{w0nDERfuL_x5_LE@ks}");

mongo -- "$MONGO_INITDB_DATABASE" <<EOF
    let rootUser = '$MONGO_INITDB_ROOT_USERNAME';
    let rootPassword = '$MONGO_INITDB_ROOT_PASSWORD';
    let admin = db.getSiblingDB('admin');
    admin.auth(rootUser, rootPassword);

    use result;
    const flag_x = '$flag_x';
    let admin1 = {
        entry: 'https://cnss.io/FOo8Ar_EntRy/casio3',
        url: 'https://xsleaks.dev/#H3LLO_mY_M@5Ter,_7his_i5_The_fla6',
        text: BinData(0, flag_x),
        role: 'admin',
        username: 'admin',
        session_id: ' Hello my master, this is the flag. ',
        create_time: '0'
    }
    let admin2 = {
        entry: 'https://cnss.io/FOo8Ar_EntRy/casio3',
        url: 'https://xsleaks.dev/#v1OR_w4nts_4_G1RlfRIEND,_i_aM_sUr3',
        text: BinData(0, flag_x),
        role: 'admin',
        username: 'admin',
        session_id: ' Vior wants a girlfriend, I am sure. ',
        create_time: '0'
    }
    let admin3 = {
        entry: 'https://cnss.io/FOo8Ar_EntRy/casio3',
        url: 'https://xsleaks.dev/#Do_yOU_H@VE_4_61R1FRi3ND',
        text: BinData(0, flag_x),
        role: 'admin',
        username: 'admin',
        session_id: ' DO YOU HAVE A GIRLFRIEND>>> ',
        create_time: '0'
    }
    let admin4 = {
        entry: 'https://cnss.io/FOo8Ar_EntRy/casio3',
        url: 'https://xsleaks.dev/#DO_I_haVE_a_6iRLFRIEND',
        text: BinData(0, flag_x),
        role: 'admin',
        username: 'admin',
        session_id: ' DO I HAVE A GIRLFRIEND<<< ',
        create_time: '0'
    }
    let admin5 = {
        entry: 'https://cnss.io/FOo8Ar_EntRy/casio3',
        url: 'https://xsleaks.dev/#C@5i03_nE3d5_a_B0yFRieNd',
        text: BinData(0, flag_x),
        role: 'admin',
        username: 'admin',
        session_id: ' Ca5io3 Needs a boyfriend. ',
        create_time: '0'
    }
    db.pages.insertMany(
        [admin1, admin2, admin3, admin4, admin5]
    );
EOF
