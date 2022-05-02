<template>
    <div>
        <div class="section" v-if="roomId === null">
            <div class="container">
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">Sleepster: Choose Room</span>
                        <div class="row">
                            <div class="input-field col s12">
                                <input type="number" step="1" v-model="tempRoomId" id="room-id" name="room-id" />
                                <label for="room-id">Room ID</label>
                            </div>
                        </div>
                    </div>
                    <div class="card-action grey lighten-4">
                        <a class="btn blue white-text waves-effect" @click="setRoom">Join Room</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="section" v-else>
            <div class="container">
                <div class="card">
                    <div class="card-content">
                        <span class="card-title">Sleepster: Transfer Files</span>

                        <div class="section center-align">
                            <div v-if="!connected">
                                <i class="material-icons large orange-text">online_prediction</i>
                            </div>
                            <div v-else-if="!fileReceived">
                                <i class="material-icons large green-text">check</i>
                            </div>
                            <div v-else>
                                <i class="material-icons large green-text">cloud_download</i>
                            </div>
                            <span>Status: <b>{{ status }}</b></span>
                        </div>
                        <div class="divider"></div>
                        <div class="section" v-if="connected">
                            <h5 class="header">Send a File</h5>
                            <div class="file-field input-field">
                                <div class="btn">
                                    <span>File</span>
                                    <input type="file" @change="selectFile">
                                </div>
                                <div class="file-path-wrapper">
                                    <input class="file-path validate" type="text">
                                </div>
                            </div>
                            <button class="btn blue white-text waves-effect" @click="sendFile">Send File</button>
                        </div>
                        <div class="divider"></div>
                        <div class="section" v-if="fileReceived">
                            <h5 class="header">Received File</h5>
                            You have received a file! Would you like to download it now?
                            <br />
                            Filename: <b>{{ fileName.current }}</b>
                            <div class="row center-align">
                                <button class="btn blue white-text waves-effect" @click="download">Download File</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script type="text/javascript">
    import io from 'socket.io-client'
    import Peer from 'simple-peer'
    import streamSaver from 'streamsaver';
    export default {
        data: function () {
            return {
                socket: {
                    current: null,
                },
                roomId: null,
                tempRoomId: null,
                connected: false,
                fileReceived: false,
                worker: null,
                fileName: {
                    current: null,
                },
                file: null,
                reader: null,
                status: 'Connecting...',
                partner: null,
            };
        },
        watch: {
            connected: function (newConnected) {
                let vm = this;
                if (newConnected && vm.fileReceived) {
                    vm.status = "File Received";
                } else if (newConnected && !vm.filesReceived) {
                    vm.status = "Connected";
                } else {
                    vm.status = "Connecting...";
                }
            },
            fileReceived: function (newFileReceived) {
                let vm = this;
                if (newFileReceived) {
                    vm.status = "File Received";
                }
            },
            roomId: function (newRoomId) {
                let vm = this;
                if (newRoomId !== null) {
                    vm.initializeSocket();
                }
            }
        },
        mounted: function () {
            let vm = this;
            vm.worker = new Worker('./worker.js');
        },
        methods: {
            setRoom: function () {
                return new Promise((resolve) => {
                    let vm = this;
                    if (vm.tempRoomId !== null) {
                        vm.roomId = vm.tempRoomId;
                    }
                    resolve();
                });
            },
            initializeSocket: function () {
                return new Promise((resolve, reject) => {
                    let vm = this;
                    vm.socket.current = io.connect('/');
                    vm.socket.current.emit('join', vm.roomId);
                    vm.socket.current.on('list', users => {
                        if (users.length > 0) {
                            vm.peer = vm.createPeer(users[0], vm.socket.current.id);
                        }
                        console.info('list', users);
                    });

                    vm.socket.current.on('joined', data => {
                        console.info('joined', data);
                        vm.peer = vm.addPeer(data.payload, data.user);
                    });

                    vm.socket.current.on('returned', data => {
                        vm.peer.signal(data.payload);
                        vm.connected = true;
                        console.info('connected', data);
                    });

                    vm.socket.current.on('disconnected', data => {
                        const userId = data;
                        if (vm.partner === userId) {
                            vm.connected = false;
                            vm.partner = null;
                            console.info('disconnected', data);
                        }
                    });

                    vm.socket.current.on('disconnect', () => {
                        vm.connected = false;
                        vm.partner = null;
                    });
                    resolve();
                });
            },
            createPeer: function (userToSignal, callerId) {
                let vm = this;
                const peer = new Peer({
                    initiator: true,
                    trickle: false,
                });

                vm.partner = userToSignal;

                peer.on('signal', signal => {
                    console.info('sending', { recipient: userToSignal, user: callerId, payload: signal });
                    vm.socket.current.emit('sending', { recipient: userToSignal, user: callerId, payload: signal });
                });

                peer.on('data', vm.handleReceivingData);

                peer.on('close', () => {
                    vm.connected = false;
                    vm.partner = null;
                });

                peer.on('error', (err) => {
                    vm.connected = false;
                    vm.partner = null;
                    console.error('Error from WebRTC Peer', err);
                });

                return peer;
            },
            addPeer: function (payload, recipient) {
                let vm = this;
                const peer = new Peer({
                    initiator: false,
                    trickle: false,
                });

                vm.partner = recipient;

                peer.on('signal', signal => {
                    console.info('returning', { payload: signal, recipient: recipient })
                    vm.socket.current.emit('returning', { payload: signal, recipient: recipient });
                });

                peer.on('data', vm.handleReceivingData);

                peer.signal(payload);
                vm.connected = true;
                return peer;
            },
            handleReceivingData: function (data) {
                let vm = this;
                console.info('Received Data', data);
                if (data.toString().includes('done')) {
                    vm.fileReceived = true;
                    const parsedData = JSON.parse(data);
                    vm.fileName.current = parsedData.fileName;
                } else {
                    vm.worker.postMessage(data);
                }
            },
            download: function () {
                let vm = this;
                vm.fileReceived = false;
                vm.worker.postMessage('download');
                vm.worker.addEventListener('message', event => {
                    const stream = event.data.stream();
                    const fileStream = streamSaver.createWriteStream(vm.fileName.current);
                    stream.pipeTo(fileStream);
                });
            },
            selectFile: function (event) {
                let vm = this;
                vm.file = event.target.files[0];
            },
            sendFile: function () {
                let vm = this;
                const peer = vm.peer;
                const stream = vm.file.stream();
                const reader = stream.getReader();

                reader.read().then(obj => {
                    console.info('1 Handle Reading', obj);
                    handleReading(obj.done, obj.value);
                });

                function handleReading(done, value) {
                    if (done) {
                        peer.write(JSON.stringify({ done: true, fileName: vm.file.name }));
                        console.info('Done Writing', JSON.stringify({ done: true, fileName: vm.file.name }))
                        // console.info('done');
                        return;
                    }

                    console.info('Writing', value);
                    peer.send(value);
                    reader.read().then(obj => {
                        console.info('2 Handle Reading', obj);
                        handleReading(obj.done, obj.value);
                    });
                }
            },
            /*handleReading: function (done, value) {
                let vm = this;
                // const peer = vm.peer;
                if (done) {
                    try {
                        vm.peer.write(JSON.stringify({ done: true, fileName: vm.file.name }));
                        console.info('Done Writing', JSON.stringify({ done: true, fileName: vm.file.name }))
                    } catch (err) {
                        console.error("Custom Error", err);
                    }
                    
                    return;
                }

                console.info('Writing', value);
                vm.peer.write(value);
                vm.reader.read().then(obj => {
                    console.info('2 Handle Reading', obj);
                    vm.handleReading(obj.done, obj.value);
                });
            }*/
        }
    }
</script>