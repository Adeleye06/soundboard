import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function App() {
    const [preloadedSounds, setPreloadedSounds] = useState([
        { uri: require('./bop.m4a'), name: 'Bop' },
        { uri: require('./melody.m4a'), name: 'Melody' },
        { uri: require('./samp.m4a'), name: 'Sample' },
        { uri: require('./sound.m4a'), name: 'Sound' },
        { uri: require('./tone.m4a'), name: 'Tone' },
    ]);

    const [recordedSounds, setRecordedSounds] = useState([]);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionsResponse, requestPermission] = Audio.usePermissions();

    const startRecording = async () => {
        try {
            if (permissionsResponse.status !== 'granted') {
                console.log('Requesting permissions.');
                await requestPermission();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording...');
            const recordingObject = new Audio.Recording();
            await recordingObject.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            setRecording(recordingObject);
            setIsRecording(true);
            await recordingObject.startAsync();
            console.log('...recording');
        } catch (error) {
            console.error('Failed to start recording: ', error);
        }
    };

    const stopRecording = async () => { //stop recording
        try {
            if (recording) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                const shouldSave = await promptToSaveRecording(uri); // Prompt to save the recording
                if (shouldSave) {
                    const recordingName = await promptForRecordingName(); // Prompt for the name of the recording
                    if (recordingName) {
                        // Save the recording with the provided name
                        await saveRecording(uri, recordingName);
                    } else {
                        console.log('Recording not saved: No name provided');
                    }
                } else {
                    console.log('Recording not saved');
                }
                setRecording(null);
                setIsRecording(false);
                console.log('Recording stopped and stored at ', uri);
            }
        } catch (errorEvent) {
            console.error('Failed to stop recording: ', errorEvent);
        }
    };

    const promptToSaveRecording = async (uri) => {
        return new Promise((resolve) => {
            Alert.alert(
                'Save Recording?',
                'Do you want to save this recording?',
                [
                    { text: 'No', onPress: () => resolve(false) },
                    { text: 'Yes', onPress: () => resolve(true) },
                ],
                { cancelable: false }
            );
        });
    };

    const promptForRecordingName = async () => {
        return new Promise((resolve) => {
            Alert.prompt(
                'Recording Name',
                'Please enter the name for the recording:',
                [
                    { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
                    { text: 'Save', onPress: (input) => resolve(input) },
                ],
                'plain-text',
                ''
            );
        });
    };

    const saveRecording = async (uri, recordingName) => {
        // Implement the logic to save the recording with the provided name
        console.log(`Recording "${recordingName}" saved at ${uri}`);
        setRecordedSounds([...recordedSounds, { uri, name: recordingName }]);
    };


    const playSound = async (sound) => {
        const { sound: playbackSound } = await Audio.Sound.createAsync(sound);
        await playbackSound.playAsync();
    };

    const playPreloadedSound = async (index) => { // play preloaded sound
    try {
        const sound = preloadedSounds[index].uri;
        await playSound(sound);
    } catch (error) {
        console.error('Failed to play preloaded sound: ', error);
    }
};

    const playRecordedSound = async (index) => {
        try {
            const sound = recordedSounds[index].uri; // Get the URI of the recorded sound
            await playSound({ uri: sound });
        } catch (error) {
            console.error('Failed to play recorded sound: ', error);
            Alert.alert('Error', 'Failed to play recorded sound.');
        }
    };




    // user can add sound from files on device
    const pickSound = async () => {
        try {
            const { uri } = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: false
            });

            if (uri) {
                const name = uri.substring(uri.lastIndexOf('/') + 1);
                setRecordedSounds([...recordedSounds, { uri, name }]);
            }
        } catch (error) {
            console.error('Failed to pick sound: ', error);
            Alert.alert('Error', 'Failed to pick sound from file.');
        }
    };
     // allows user to delete sound
    const deleteSound = (index) => {
        const newSounds = [...recordedSounds];
        newSounds.splice(index, 1);
        setRecordedSounds(newSounds);
    };

    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, [recording]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Soundboard App</Text>
            <ScrollView contentContainerStyle={styles.gridContainer}>
                {preloadedSounds.map((sound, index) => ( // preloaded sounds 
                    <TouchableOpacity key={index} style={styles.soundButton} onPress={() => playPreloadedSound(index)}>
                        <Text style={styles.buttonText}>{sound.name}</Text>
                    </TouchableOpacity>
                ))}
                {recordedSounds.map((sound, index) => (
                    <TouchableOpacity key={index + preloadedSounds.length} style={styles.soundButton} onPress={() => playRecordedSound(index)}>
                        <Text style={styles.buttonText}>{sound.name}</Text>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteSound(index)}>
                            <Text style={styles.deleteButtonText}>X</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.soundButton, styles.addSoundButton]} onPress={pickSound}>
                    <Text style={styles.buttonText}>Add Sound</Text>
                </TouchableOpacity>
            </ScrollView>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={isRecording ? stopRecording : startRecording}>
                    <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
                </TouchableOpacity>
            </View>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20, // Add horizontal padding
        paddingVertical: 40,   // Add vertical padding
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    soundButton: {
        backgroundColor: '#007AFF',
        padding: 20,
        margin: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '40%',
    },
    addSoundButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    buttonContainer: {
        marginTop: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 10,
    },
});


