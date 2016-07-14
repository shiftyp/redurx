import h from 'snabbdom/h';

const ItemContainer = ({ item }) => {
  return (
    <div class="container">
      <h2>This is the item page! The ID is {item.id}</h2>
      <p>{item.text}</p>
    </div>
  )
};

export default ItemContainer;
