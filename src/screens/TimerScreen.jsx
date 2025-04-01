import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { useState } from 'react';
const TimerScreen = () => {

  const [roundDuration, setRoundDuration] = useState(70);
  const [restDuration, setRestDuration] = useState(5);
  const [numberOfRounds, setNumberOfRounds] = useState(2);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(roundDuration);
  const [isResting, setIsResting] = useState(false);
  const [resetFlag, setResetFlag] = useState(false);  


  const countDown = useRef(null);

  useEffect(() => {
    setTime(isResting ? restDuration : roundDuration);
  }, [roundDuration, restDuration, isResting, resetFlag]);

  const startCountDown = () => {
    if (currentRound <= numberOfRounds) {
      setIsRunning(true);
      countDown.current = setInterval(() => {
        setTime((prevTime) => 
          {
            if(prevTime===0)
              {
                clearInterval(countDown.current);
              if(currentRound<numberOfRounds){
                if(isResting){
                  setCurrentRound(currentRound+1);
                  setIsResting(false);
                  return roundDuration
                }
                else{
                  setIsResting(true);
                  return restDuration
                }
              }else{
                setIsRunning(false);
                setIsResting(false);
                return 0;
              }
          }return prevTime-1;  
          });
      }, 1000);
    }
  }
  const pauseCountDown = () => {
    if(isRunning){
      setIsRunning(false);
      clearInterval(countDown.current);

    }
  }

  const resetCountDown = () => {
    setCurrentRound(1);
    setIsResting(false);
    setIsRunning(false);
    clearInterval(countDown.current);
    setResetFlag(!resetFlag);
    setTime(roundDuration);
  }

  useEffect(() => {
    if(isRunning && time === 0){
      if(currentRound<numberOfRounds){
        if(isResting){
          setCurrentRound(currentRound+1);
          setIsResting(false);
          setTime(roundDuration);}
          else{
            setIsResting(true);
            setTime(restDuration);  
          }
      }
      else{
        setIsRunning(false);  
        setIsResting(false);
        setTime(0);

      }
    }
  },[isRunning, time]);


  return (
    <View className='pt-[30%] items-center min-h-screen bg-grat-200'>
      <Text className='text-5xl mb-4'>
        {isRunning
          ? isResting
            ? 'Resting' 
              : `Round ${currentRound}` 
            : currentRound===1 && time === roundDuration 
            ? "Start" 
            : currentRound === numberOfRounds && time === 0 
            ? 
            "Finished" 
            : "Paused"}</Text>

        <Text className='text-5xl'>
          {`${Math.floor(time / 60)}:${time % 60<10 ? "0" : ''} ${time % 60}`}</Text>

        <View className='flex-row mt-4'>
          <TouchableOpacity className='mx-4 bg-white px-4 py-1 rounded-lg' onPress={startCountDown}
          disabled={isRunning || currentRound>numberOfRounds}>
            <Text className='text-lg text-green-500'>START</Text>
          </TouchableOpacity>
          <TouchableOpacity className='mx-4 bg-white px-4 py-1 rounded-lg' onPress={pauseCountDown}
          disabled={!isRunning}>
            <Text className='text-lg text-red-500'>PAUSE</Text>
          </TouchableOpacity>
          <TouchableOpacity className='mx-4 bg-white px-4 py-1 rounded-lg' onPress={resetCountDown}
          disabled={isRunning}>
            <Text className='text-lg text-blue-500'>RESET</Text>
          </TouchableOpacity>
        </View>

        <View className='mt-8'>
          <Text className='text-xl text-slate-500'>Round Duration (seconds)</Text>
          <TextInput className='text-2xl text-neutral-950' 
          value={roundDuration.toString()}
          onChangeText={(text) => setRoundDuration(parseInt(text) || 0)}
          keyboardType='numeric'
          editable={!isRunning} />

          <Text className='text-xl text-slate-500'>Rest Duration (seconds)</Text>
          <TextInput className='text-2xl text-neutral-950' 
          value={restDuration.toString()}
          onChangeText={(text) => setRestDuration(parseInt(text) || 0)}
          keyboardType='numeric'
          editable={!isRunning} />

          <Text className='text-xl text-slate-500'>Number of Rounds</Text>
          <TextInput className='text-2xl text-neutral-950' 
          value={numberOfRounds.toString()}
          onChangeText={(text) => setNumberOfRounds(parseInt(text) || 0)}
          keyboardType='numeric'
          editable={!isRunning} />
        </View>
    </View>
  )
}

export default TimerScreen