import React from 'react';
import {
  Animated,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Image from 'react-native-fast-image';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {IGalleryItem, useLightbox, GalleryProvider} from './src/Gallery';

const window = Dimensions.get('window');

// import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue.js';

// let count = 0;
// const spyFunction = msg => {
//   if (msg.module === 'NativeAnimatedModule') {
//     console.log(++count, msg);
//   }
// };

// MessageQueue.spy(spyFunction);

const mockImages = [
  {
    id: 1,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 2,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 3,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 4,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 5,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 6,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 7,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 8,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
];

const s = StyleSheet.create({
  image: {
    width: 80,
    height: 80,
  },

  root: {
    opacity: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

interface SmallImageProps {
  item: IGalleryItem;
}

const SmallImage = ({item}: SmallImageProps) => {
  const {openLightbox, imageRef, opacity} = useLightbox(item);

  const size = window.width / 3;

  return (
    <Animated.View style={{opacity}}>
      <TouchableOpacity onPress={openLightbox}>
        <Image
          ref={imageRef}
          source={{uri: item.src}}
          style={[s.image, {width: size, height: size}]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const App = () => {
  return (
    <GalleryProvider>
      <ScrollView style={s.root} contentContainerStyle={s.scrollContent}>
        {mockImages.map(item => (
          <SmallImage key={item.id} item={item} />
        ))}
      </ScrollView>
    </GalleryProvider>
  );
};

export default App;
