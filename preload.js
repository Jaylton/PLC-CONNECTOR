// Imports
var nodes7 = require('nodes7');
const { db } = require("./fb");

// Global variables
var conn = new nodes7;
var firstLoad = false;
var CONNECTED = false;
var TAGS = {};

window.onload = () => {
    const $ = require('jquery');
    get();

    $('#connect').on('click', function () {

        // get PLC infos
        let plc_address = $('#plc_address').val();
        let plc_rack = $('#plc_rack').val();
        let plc_slot = $('#plc_slot').val();
        $('#connect').html('Connecting').prop('disabled', true);
        $('#status').addClass('d-none');

        // connection
        conn.initiateConnection({ port: 102, host: plc_address, rack: plc_rack, slot: plc_slot, debug: false }, (err) => {
            if (typeof (err) !== "undefined") {
                $('#status').html('Connection failed!')
                $('#status').removeClass('d-none');
                $('#connect').html('Connect').prop('disabled', false);
                return false;
            }

            $('#status').addClass('d-none');
            $('#disconnect').removeClass('d-none');
            $('#connect').html('Connected').prop('disabled', true);

            get();
            CONNECTED = true;

            //read items
            setInterval(() => {
                if (firstLoad && CONNECTED) {
                    conn.readAllItems(valuesReady);
                }
            }, 500);

        });
    });

    // disconnect
    $('#disconnect').on('click', function () {
        conn.dropConnection();
        CONNECTED = false;
        $('#connect').html('Connect').prop('disabled', false);
        $('#disconnect').addClass('d-none');
    })

    // change tag - boolean
    $(document.body).on('change', '.bool-tag', function () {
        const type = $(this).data('type');
        if (type === 'M') {
            const id = $(this).data('id');
            let payload = {};
            payload[id] = this.checked;

            post(payload);
        }
    });

    // change tag - numeric
    $(document.body).on('change', '.number-tag', function () {
        const type = $(this).data('type');
        if (type === 'M') {
            const val = $(this).val();
            const id = $(this).data('id');
            let payload = { [id]: id.includes('R') ? parseFloat(val) : parseInt(val) };

            post(payload);
        }
    });

    // register new tag
    $(document.body).on('submit', '#new-tag-form', function (e) {
        e.preventDefault();
        $('#address').removeClass('is-invalid')
        const format = $('#format').val();
        let address = $('#address').val();
        let value;

        //Validate forms
        if (format === 'boolean') {
            const userKeyRegExp = /^\d+\.[0-7]{1}?$/;
            const valid = userKeyRegExp.test(address);
            if (!valid) { // validate bit address
                $('#address').addClass('is-invalid')
                return false;
            }
            value = false;
        } else {
            const userKeyRegExp = /^[B,R]\d+?$/;
            const valid = userKeyRegExp.test(address);
            if (!valid) { // validate word address
                $('#address').addClass('is-invalid')
                return false;
            }
            value = 0;
        }

        address = $('#type').val() + address;
        let payload = {};
        payload[address] = value;

        post(payload);
        $('#address').val('');
    });

    /*
    * Functions
    */
    //get data from firebase
    function get() {
        const doc = db.collection('tags_s7');
        $('.tag-list').html('Loading...');
        doc.onSnapshot(docSnapshot => {//getting realtime changes
            $('.tag-list').html('Loading...');
            const tag_list = docSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            let object = {};
            if (tag_list.length === 0) {
                firstLoad = true;
            }
            let tagsHtml = '';

            //render TAGS
            tag_list.forEach(element => {
                object[element.address.replace('D', 'R')] = element.value;
                if (element.format === "boolean") {
                    tagsHtml += `
                        <div class="form-check form-switch">
                            <input class="form-check-input bool-tag" value="1" ${element.type !== 'M' ? 'disabled' : ''} type="checkbox" ${element.value ? 'checked' : ''} data-type="${element.type}" data-id="${element.id}" id="checkbox_${element.id}">
                            <label class="form-check-label" for="checkbox_${element.id}">${element.id}</label>
                        </div>
                    `;
                } else {
                    tagsHtml += `
                        <div class="input-group mt-1">
                            <span class="input-group-text">${element.address}</span>
                            <input type="text" class="form-control number-tag" ${element.type !== 'M' ? 'disabled' : ''} value="${Math.round(element.value * 1000) / 1000}" id="input_${element.id}" data-type="${element.type}" data-id="${element.id}"/>
                        </div>
                    `;
                }
            });
            $('.tag-list').html(tagsHtml);

            conn.removeItems(); //remove tags
            var tags_label = Object.keys(object);
            conn.addItems(tags_label);// add tags

            var changedTags = getChangedTags(object);
            var labels = Object.keys(changedTags);
            var values = Object.values(changedTags);

            if (CONNECTED && labels.length > 0 && values.length > 0) {
                conn.writeItems(labels, values, valuesWritten);// write tags
            }
            console.log('changedTags :>> ', changedTags);

        }, err => {
            console.log(`Encountered error: ${err}`);
        });
    }

    //send data to firebase
    function post(values) {
        var batch = db.batch();
        Object.keys(values).forEach((el, i) => {
            el = el.replace('D', 'R');
            const doc = {
                address: el,
                value: values[el],
                type: el[0],
                format: typeof values[el] === 'boolean' ? 'boolean' : 'number'
            }
            batch.set(db.collection('tags_s7').doc(el), doc);
        });

        batch.commit().then(function () {});
    }

    // check tags
    function getChangedTags(values) {
        var tagsOld = JSON.parse(JSON.stringify(TAGS));
        if (CONNECTED) {
            TAGS = values;
        }
        var changedTags = {};
        for (let i = 0; i < Object.keys(TAGS).length; i++) {
            const key = Object.keys(TAGS)[i];
            const value = Object.values(TAGS)[i];
            if (!(key in tagsOld) || value !== tagsOld[key]) {
                changedTags[key] = Object.values(TAGS)[i];
            }
        }
        return changedTags;
    }

    // values ready callback
    function valuesReady(anythingBad, values) {
        if (anythingBad) { console.log("SOMETHING WENT WRONG READING VALUES!!!!"); }
        var changedTags = getChangedTags(values);
        if (firstLoad && Object.keys(changedTags).length > 0) {
            post(changedTags)
        }
    }

    // write callback
    function valuesWritten(anythingBad) {
        if (anythingBad) { console.log("SOMETHING WENT WRONG WRITING VALUES!!!!"); }
        firstLoad = true;
    }
    /*
    * End functions
    */
}