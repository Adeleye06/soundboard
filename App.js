import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function App() {
    const [loadedSounds, setloadedSounds] = useState([
        { uri: require('./sound1.m4a'), name: 'Sound1' },
        { uri: require('./sound2.m4a'), name: 'Sound2' },
        { uri: require('./sound3.m4a'), name: 'Sound3' },
        { uri: require('./sound4.m4a'), name: 'Sound4' },
        { uri: require('./sound5.m4a'), name: 'Sound5' },
    ]);

    const [savedSounds, setSavedSounds] = useState([]);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionsReply, askPermission] = Audio.usePermissions();

    const initiateRecording = async () => {
        try {
            if (permissionsReply.status !== 'granted') {
                console.log('Asking for permissions.');
                await askPermission();
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Starting recording...');
            const recordingObj = new Audio.Recording();
            await recordingObj.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            setRecording(recordingObj);
            setIsRecording(true);
            await recordingObj.startAsync();
            console.log('...recording started');
        } catch (err) {
            console.error('Error starting recording: ', err);
        }
    };

    const endRecording = async () => { 
        try {
            if (recording) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                const allowSave = await SaveRecording(uri); 
                if (allowSave) {
                    const recordingName = await getRecordingName(); 
                    if (recordingName) {
                        
                        await saveRecording(uri, recordingName);
                    } else {
                        console.log('can not think of what to type here but you know what it is if you see it');
                    }
                } else {
                    console.log('Recording was not saved');
                }
                setRecording(null);
                setIsRecording(false);
                console.log('Recording ended and stored at ', uri);
            }
        } catch (err) {
            console.error('Failed to stop recording: ', err);
        }
    };

    const SaveRecording = async (uri) => {
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

    const getRecordingName = async () => {
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
        
        console.log(`Recording "${recordingName}" saved at ${uri}`);
        setSavedSounds([...savedSounds, { uri, name: recordingName }]);
    };


    const playSound = async (audio) => {
        const { sound: playbackSound } = await Audio.Sound.createAsync(audio);
        await playbackSound.playAsync();
    };

    const playloadedSound = async (index) => { 
    try {
        const audio = loadedSounds[index].uri;
        await playSound(audio);
    } catch (err) {
        console.error('loaded sounds could not play: ', err);
    }
};

    const playRecordedSound = async (index) => {
        try {
            const audio = savedSounds[index].uri; 
            await playSound({ uri: audio });
        } catch (err) {
            console.error('Failed to play recorded sound: ', err);
            Alert.alert('Error', 'Failed to play recorded sound.');
        }
    };




  
    const selectSound = async () => {
        try {
            const { type, uri } = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: false
            });

            if (type === 'success' && uri) {
                const name = uri.substring(uri.lastIndexOf('/') + 1);
                setSavedSounds([...savedSounds, { uri, name }]);
                console.log('Sound added:', name); 
            } else {
                console.log('No audio file selected');
            }
        } catch (err) {
            console.error('Failed to pick sound: ', err);
            Alert.alert('Error', 'Failed to pick sound from file.');
        }
    };


    const deleteSound = (index) => {
        const newAudio = [...savedSounds];
        newAudio.splice(index, 1);
        setSavedSounds(newAudio);
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
            <Text style={styles.title}>My Soundboard</Text>
            <ScrollView contentContainerStyle={styles.gridContainer}>
                {loadedSounds.map((sound, index) => ( 
                    <TouchableOpacity key={index} style={styles.soundButton} onPress={() => playloadedSound(index)}>
                        <Text style={styles.buttonText}>{sound.name}</Text>
                    </TouchableOpacity>
                ))}
                {savedSounds.map((sound, index) => (
                    <TouchableOpacity key={index + loadedSounds.length} style={styles.soundButton} onPress={() => playRecordedSound(index)}>
                        <Text style={styles.buttonText}>{sound.name}</Text>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteSound(index)}>
                            <Text style={styles.deleteButtonText}>X</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.soundButton, styles.addSoundButton]} onPress={selectSound}>
                    <Text style={styles.buttonText}>Add Another Sound</Text>
                </TouchableOpacity>
            </ScrollView>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={isRecording ? endRecording : initiateRecording}>
                    <Text style={styles.buttonText}>{isRecording ? 'End Recording' : 'Initiate Recording'}</Text>
                </TouchableOpacity>
            </View>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F0F0F0', 
      alignItems: 'center',
      justifyContent: 'flex-start', 
      paddingTop: 50, 
    },
    title: {
      fontSize: 28,
      fontWeight: '600',
      color: '#333', 
      marginBottom: 30,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      width: '100%', 
    },
    soundButton: {
      backgroundColor: '#008B8B', 
      paddingVertical: 15,
      paddingHorizontal: 15,
      margin: 5,
      borderRadius: 20, 
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3, 
      shadowColor: '#000', 
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      minWidth: '45%', 
      textAlign: 'center',
    },
    addSoundButton: {
      backgroundColor: '#6A5ACD', 
    },
    buttonText: {
      color: '#FFFFFF', 
      fontSize: 14,
      fontWeight: 'bold',
    },
    deleteButton: {
      position: 'absolute',
      top: -10,
      right: -10,
      backgroundColor: '#DC143C', 
      borderRadius: 15,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      lineHeight: 30, 
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 20,
    },
    button: {
      backgroundColor: '#20B2AA',
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 25, 
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });
