// Deliberately broken example: `tax` is never defined.
function checkout(cart) {
  let total = cart.reduce((sum, item) => sum + item.price, 0);
  total = total + tax;
  return total;
}

module.exports = { checkout };
