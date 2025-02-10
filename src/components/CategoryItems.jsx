import { View, Text, FlatList, TouchableOpacity, ImageBackground } from 'react-native'
import React from 'react'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const beginner = require("../../assets/images/beginner.jpg")
const balance = require("../../assets/images/balance.jpg")
const gentle = require("../../assets/images/gentle.jpg")
const intense = require("../../assets/images/intense.jpg")
const moderate = require("../../assets/images/moderate.jpg")
const strength = require("../../assets/images/strength.jpg")
const toning = require("../../assets/images/toning.jpg")

const workoutData= [
    {id:1,imageSource:balance,numberOfExercises:9,title:'Balance'},
    {id:2,imageSource:beginner,numberOfExercises:7,title:'Beginner'},
    {id:3,imageSource:gentle,numberOfExercises:5,title:'Gentle'},
    {id:4,imageSource:intense,numberOfExercises:8,title:'Intense'},
    {id:5,imageSource:moderate,numberOfExercises:23,title:'Moderate'},
    {id:6,imageSource:strength,numberOfExercises:11,title:'Strength'},
    {id:7,imageSource:toning,numberOfExercises:10,title:'Toning'},
];


const CategoryItems = () => {

    const renderWorkoutItem = ({item}) => (
        <TouchableOpacity>
            <ImageBackground source={item.imageSource}
            className='h-36 w-40 rounded-2xl overflow-hidden mx-2 bg-red-900'>
                <View className='flex-1 justify-between m-3' 
                >
                    <View className='flex-row items-center space-x-1'>
                    <FontAwesome5 name="dumbbell" size={15} color="white" />
                    <Text className='text-white font-bold -tracking-widest'>{item.numberOfExercises}</Text>
                    </View>
                    <Text className='text-white font-medium tracking-widest'>{item.title}</Text>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );


  return (
    <View>
      <FlatList
      data={workoutData}
      renderItem={renderWorkoutItem}
      keyExtractor={(item)=>item.id}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      ></FlatList>
    </View>
  )
}

export default CategoryItems