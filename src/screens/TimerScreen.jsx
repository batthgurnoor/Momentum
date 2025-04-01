import { View, Text } from 'react-native'
import React, { useEffect } from 'react'

const TimerScreen = () => {

  const [roundDuration, setRoundDuration] = useState(10);
  const [restDuration, setRestDuration] = useState(5);
  const [numberOfRounds, setNumberOfRounds] = useState(2);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(roundDuration);
  const [isResting, setIsResting] = useState(false);
  const [resetFlag, setResetFlag] = useState(false);  

  useEffect(() => {
    setTime(isResting ? restDuration : roundDuration);
  }, [roundDuration, restDuration, isResting, resetFlag]);

  return (
    <View>
      <Text>
        {isRunning
          ? isResting
            ? 'Resting' 
              : `Round ${currentRound}` 
            : currentRound===1 && time === roundDuration ? "Start" :
        currentRound === numberOfRounds && time === 0 ? "Finished" : "Pause"}</Text>

        <Text>{`${Math.floor(time / 60)}:${time % 60<10 ? "0" : ''} ${time % 60}`}</Text>
    </View>
  )
}

export default TimerScreen