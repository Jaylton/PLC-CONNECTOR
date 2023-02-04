var nodes7 = require('nodes7'); // This is the package name, if the repository is cloned you may need to require 'nodeS7' with uppercase S

const { db } = require("./fb");
var conn = new nodes7;
var firstLoad = false;
var connected = false;
var tags = {};
window.onload = () => {
    const $ = require('jquery')
    console.log('ON!!!!!!!!!!!!');
    get();

    $('#connect').on('click', function(){
        let plc_address = $('#plc_address').val();
        let plc_rack = $('#plc_rack').val();
        let plc_slot = $('#plc_slot').val();
        $('#connect').html('Connecting').prop('disabled', true);
        $('#status').addClass('d-none');
        conn.initiateConnection({ port: 102, host: plc_address, rack: plc_rack, slot: plc_slot, debug: false }, (err) => {
            if (typeof(err) !== "undefined") {
                // We have an error. Maybe the PLC is not reachable.
                console.log(err);
                // process.exit();
                $('#status').html('Connection failed!')
                $('#status').removeClass('d-none');
                $('#connect').html('Connect').prop('disabled', false);
                return false;
            }
            $('#status').addClass('d-none');
            $('#disconnect').removeClass('d-none');
            $('#connect').html('Connected').prop('disabled', true);

            get();
            connected = true;
            setInterval(() => {
                if(firstLoad && connected){
                    conn.readAllItems(valuesReady);
                }
            }, 1000);
            
        });
    });
    
    $('#disconnect').on('click', function(){
        conn.dropConnection();
        connected = false;
        $('#connect').html('Connect').prop('disabled', false);
        $('#disconnect').addClass('d-none');
    })

    $(document.body).on('change', '.bool-tag', function(){
        const type = $(this).data('type');
        if(type === 'M'){
            const id = $(this).data('id');
            let payload = {};
            payload[id] = this.checked;

            post(payload);
        }
    });
    
    $(document.body).on('change', '.number-tag', function(){
        const type = $(this).data('type');
        if(type === 'M'){
            const val = $(this).val();
            const id = $(this).data('id');
            let payload = {[id]: id.includes('R') ? parseFloat(val) : parseInt(val)};
            
            post(payload);
        }
    });

    $(document.body).on('submit', '#new-tag-form', function(e){
        e.preventDefault();
        $('#address').removeClass('is-invalid')
        const format = $('#format').val();
        let address = $('#address').val();
        let value;
        if(format === 'boolean'){
            const userKeyRegExp = /^\d+\.[0-7]{1}?$/;
            const valid = userKeyRegExp.test(address);
            if(!valid){ // validate bit address
              $('#address').addClass('is-invalid')
              return false;
            }
            value = false;
        }else{
            const userKeyRegExp = /^[B,R]\d+?$/;
            const valid = userKeyRegExp.test(address);
            if(!valid){ // validate word address
                $('#address').addClass('is-invalid')
              return false;
            }
            value = 0;
        }
        address = $('#type').val()+ address; 
        let payload = {};
        payload[address] = value;
        
        post(payload);
        $('#address').val('');
    });

    function get(){ //get data from firebase
        const doc = db.collection('tags_s7');
        $('.tag-list').html('Loading...');
        doc.onSnapshot(docSnapshot => {//getting realtime changes
            $('.tag-list').html('Loading...');
            const tag_list = docSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            let object = {};
            if(tag_list.length === 0){
                firstLoad = true;
            }
            let tagsHtml = '';

            //render tags
            tag_list.forEach(element => {
                object[element.address.replace('D','R')] = element.value;
                if(element.format === "boolean"){
                    tagsHtml += `
                        <div class="form-check form-switch">
                            <input class="form-check-input bool-tag" value="1" ${element.type !== 'M' ? 'disabled' : ''} type="checkbox" ${element.value ? 'checked' : ''} data-type="${element.type}" data-id="${element.id}" id="checkbox_${element.id}">
                            <label class="form-check-label" for="checkbox_${element.id}">${element.id}</label>
                        </div>
                    `;
                }else{
                    tagsHtml += `
                        <div class="input-group mt-1">
                            <span class="input-group-text">${element.address}</span>
                            <input type="text" class="form-control number-tag" ${element.type !== 'M' ? 'disabled' : ''} value="${Math.round(element.value*1000)/1000}" id="input_${element.id}" data-type="${element.type}" data-id="${element.id}"/>
                        </div>
                    `;
                }
            });
            $('.tag-list').html(tagsHtml);
            var tags_label = Object.keys(object);
            conn.addItems(tags_label);// add tags

            toDelete(tag_list); // check if has tags to delete
            
            var changedTags = getChangedTags(object);
            var labels = Object.keys(changedTags);
            var values = Object.values(changedTags);
            
            if(connected && labels.length > 0 && values.length > 0){
                conn.writeItems(labels, values, valuesWritten);// write tags
            }
            console.log('changedTags :>> ', changedTags);
    
        }, err => {
        console.log(`Encountered error: ${err}`);
        });
    }
    
    function post(values){
        var batch = db.batch();
        Object.keys(values).forEach((el, i) => {
            el = el.replace('D','R');
            const doc = {
                address: el,
                value: values[el],
                type: el[0],
                format: typeof values[el] === 'boolean' ? 'boolean' : 'number'
            }
            batch.set(db.collection('tags_s7').doc(el), doc);
        });
    
        batch.commit().then(function () {
            console.log('batch ok');
        });
    }
    
    function getChangedTags(values){
        var tagsOld = JSON.parse(JSON.stringify(tags));
        if(connected){
            tags = values;
        }
        var changedTags = {};
        for (let i = 0; i < Object.keys(tags).length; i++) {
            const key = Object.keys(tags)[i];
            const value = Object.values(tags)[i];
            if(!(key in tagsOld) || value !== tagsOld[key]){
                changedTags[key] = Object.values(tags)[i];
            }
        }
        return changedTags;
    }
    
    function toDelete(list){
        var labels = list.map(x => x.address);
        var tagsOld = JSON.parse(JSON.stringify(tags));
        
        for (let i = 0; i < Object.keys(tagsOld).length; i++) {
            const key = Object.keys(tagsOld)[i];
            if(!(key in labels)){
                delete tags[key];
                conn.removeItems(key);
            }
        }
        return true;
    }
    
    function valuesReady(anythingBad, values) {
        if (anythingBad) { console.log("SOMETHING WENT WRONG READING VALUES!!!!"); }
        var changedTags = getChangedTags(values);
        if(firstLoad && Object.keys(changedTags).length > 0){
            post(changedTags)
        }
        // conn.readAllItems(valuesReady);
        // doneReading = true;
        // if (doneWriting) { process.exit(); }
    }
    
    function valuesWritten(anythingBad) {
        if (anythingBad) { console.log("SOMETHING WENT WRONG WRITING VALUES!!!!"); }
        console.log("Done writing.");
        firstLoad = true;
        // doneWriting = true;
        // if (doneReading) { process.exit(); }
    }

    function isInt(n){
        return Number(n) === n && n % 1 === 0;
    }
}