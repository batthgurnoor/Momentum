import { View, Text, TouchableOpacity, ImageBackground } from 'react-native'
import React from 'react'
import workoutData from '../../exercise_data'
import { FlashList } from '@shopify/flash-list'

const exerciseImage = require('../../assets/images/exercise1.jpg')

const ExerciseItems = () => {

    const renderWorkoutItem =({item}) => (
        <TouchableOpacity>
            <ImageBackground source={exerciseImage}
            className='h-44 w-40 rounded-2xl overflow-hidden mx-2'>
                <View>
                    <Text>{item.category}</Text>
                    <Text>{item.title}</Text>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    )

    const RenderRow = ({item,index}) =>{
        if(index%2==0){
            const nextItem = workoutData[index+1]
            return (
                <View>
                    {renderWorkoutItem({item})}
                     {nextItem && renderWorkoutItem({item:nextItem})}
                </View>
            )
        }

    }
  return (
    <View>
      <FlashList 
      data={workoutData}
      renderItem= {RenderRow}
      keyExtractor={(item)=> item.id}
      showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default ExerciseItems;