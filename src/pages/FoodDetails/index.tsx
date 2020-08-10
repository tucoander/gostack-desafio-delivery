import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image, Alert } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const response = await api.get<Food>(`/foods/${routeParams.id}`);

      const extraFood = response.data.extras.map<Extra>(extra => {
        return {
          id: extra.id,
          name: extra.name,
          value: extra.value,
          quantity: 0,
        };
      });

      setExtras(extraFood);

      const food = Object.assign({
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        price: response.data.price,
        image_url: response.data.image_url,
        formattedPrice: formatValue(response.data.price),
        extras: extras,
      });
      setFood(food);

      try {
        const responseFavorite = await api.get<Food>(`/favorites/${food.id}`);
        if (responseFavorite.status === 200) {
          setIsFavorite(true);
        }
      } catch (err) {
        console.log(err);
      }
    }
    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const extraIncremented = extras.map(extra => {
      return {
        id: extra.id,
        name: extra.name,
        quantity: extra.id === id ? extra.quantity + 1 : extra.quantity,
        value: extra.value,
      };
    });
    setExtras(extraIncremented);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const extraDecremented = extras.map(extra => {
      return {
        id: extra.id,
        name: extra.name,
        quantity:
          extra.id === id
            ? extra.quantity > 0
              ? extra.quantity - 1
              : extra.quantity
            : extra.quantity,
        value: extra.value,
      };
    });

    setExtras(extraDecremented);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity > 1) {
      setFoodQuantity(foodQuantity - 1);
    } else {
      Alert.alert('Erro na quantidade', 'Quantidade não pode ser menor que 1');
    }
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    try {
      const response = await api.get<Food>(`/favorites/${food.id}`);
      if (response.status === 200) {
        await api.delete<Food>(`/favorites/${food.id}`);
        setIsFavorite(false);
      }
    } catch (err) {
      await api.post<Food>(`/favorites/`, {
        id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        thumbnail_url: food.image_url,
        formattedPrice: food.formattedPrice,
        category: food.category,
        image_url: food.image_url,
        extras: extras,
      });
      setIsFavorite(true);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    let totalValue: number = food.price * foodQuantity;
    let extraValue = extras.reduce(function (total, extra) {
      return (total = total + extra.value * extra.quantity);
    }, 0);

    return formatValue(totalValue + extraValue);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    let lastID = 0;
    try {
      const responseOrders = await api.get('orders');
      responseOrders.data.map((order: any) =>
        order.id >= lastID
          ? (lastID = order.id + 1)
          : console.log(lastID, order.id),
      );
    } catch (err) {
      console.log(err);
    }

    console.log(lastID);

    const orderedFood = Object.assign({
      id: lastID,
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      image_url: food.image_url,
      extras: extras,
    });

    console.log(orderedFood);
    try {
      await api.post('orders', orderedFood);
      navigation.navigate('Orders');
    } catch (err) {
      console.log(err);
    }
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
