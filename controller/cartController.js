const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')

exports.getACart = async (req, res) => {
    try {
        const cart = await cartModel.findOne({ userid: req.user }).populate({ path: 'products', populate: 'product' })
        res.status(200).json(cart)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'someting went wrong' })
    }
}
exports.AddCart = async (req, res) => {
    try {

        const { product, qty, size } = req.body
        if (!product) return res.status(400).json({ message: 'all fields require' })
        const found = await cartModel.findOne({ userid: req.user })
        const productDetails = await productModel.findById(product)
        const price = productDetails.price * qty
        const discountPrice = productDetails.discountPrice * qty
        if (!found) {
            const newCart = new cartModel({ userid: req.user, proudcts: [{ product, qty, size, price, discountPrice }], totalPrice: price, totalPrice: discountPrice })
            await newCart.save()
            return res.status(201).json({ message: 'product added to cart successfully' })
        }
        if (!found.products.find(e => e.product == product && e.size == size)) {
            await cartModel.findByIdAndUpdate(found._id, { $push: { products: { product, qty, size, price, discountPrice } } })
            await cartModel.findByIdAndUpdate(found._id, { $inc: { totalPrice: price, totalPrice: discountPrice } })
            return res.status(201).json({ message: 'product added to cart successfully' })
        }
        await cartModel.updateOne({ 'products.product': product }, { '$inc': { 'products.$.qty': qty, 'products.$.price': price, 'products.$.discountPrice': discountPrice } })
        await cartModel.findByIdAndUpdate(found._id, { $inc: { totalPrice: price, totalPrice: discountPrice } })
        res.status(201).json({ message: 'cart updated successfully' })


    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'someting went wrong' })
    }
}

exports.removeFromCart = async (req, res) => {
    try {
        const { product } = req.body
        if (!product) return res.status(400).json({ message: 'all fields require' })
        const cart = await cartModel.findOne({ userid: req.user })
        const productDetail = cart.products.filter(e => e.product == product)
        const price = productDetail[0].price * -1
        await cartModel.findOneAndUpdate({ userid: req.user }, { $pull: { products: { product } } })
        await cartModel.findByIdAndUpdate(cart._id, { $inc: { totalPrice: price } })
        res.status(201).json({ message: 'item removed from cart' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'someting went wrong' })
    }
}