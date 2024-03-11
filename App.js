import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

export default function App() {
    const [preloadedSounds, setPreloadedSounds] = useState([
        require('./bop.m4a'),
        require('./melody.m4a'),
        require('./samp.m4a'),
        require('./sound.m4a'),
        require('./tone.m4a'),
    ]);
    const [recordedSounds, setRecordedSounds] = useState([]);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionsResponse, requestPermission] = Audio.usePermissions();

    const startRecording = async () => { // start recording
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
                setRecordedSounds([...recordedSounds, uri]);
                setRecording(null);
                setIsRecording(false);
                console.log('Recording stopped and stored at ', uri);
            }
        } catch (errorEvent) {
            console.error('Failed to stop recording: ', errorEvent);
        }
    };

    const playSound = async (sound) => { // play sound, preloaded or recorded
        const { sound: playbackSound } = await Audio.Sound.createAsync(sound);
        await playbackSound.playAsync();
    };

    const playPreloadedSound = async (index) => { // play preloaded sound
        const sound = preloadedSounds[index];
        await playSound(sound);
    };

    const playRecordedSound = async (index) => { // play recorded sound
        const sound = recordedSounds[index];
        await playSound({ uri: sound });
    };

    const pickSound = async () => {
        try {
            const { uri } = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: false
            });

            if (uri) {
                setRecordedSounds([...recordedSounds, uri]);
            }
        } catch (error) {
            console.error('Failed to pick sound: ', error);
            Alert.alert('Error', 'Failed to pick sound from file.');
        }
    };


    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, [recording]); // Added recording dependency to useEffect

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Soundboard App</Text>
            <ScrollView contentContainerStyle={styles.gridContainer}>
                {/* Render preloaded sounds */}
                {preloadedSounds.map((sound, index) => (
                    <TouchableOpacity key={index} style={styles.soundButton} onPress={() => playPreloadedSound(index)}>
                        <Text style={styles.buttonText}>Preloaded Sound {index + 1}</Text>
                    </TouchableOpacity>
                ))}
                {/* Render recorded sounds */}
                {recordedSounds.map((sound, index) => (
                    <TouchableOpacity key={index + preloadedSounds.length} style={styles.soundButton} onPress={() => playRecordedSound(index)}>
                        <Text style={styles.buttonText}>Recorded Sound {index + 1}</Text>
                    </TouchableOpacity>
                ))}
                {/* Add Sound button */}
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

