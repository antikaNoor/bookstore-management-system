const mongoose = require('mongoose')
const express = require('express')
const discountModel = require('./model/discount')
const bookModel = require('./model/book')
const cartModel = require('./model/cart')
const bookshopRouter = require('./routes/bookshopRoutes')
const cors = require("cors")
const databaseConnection = require('./config/database')
const dotenv = require('dotenv')
dotenv.config()

databaseConnection(() => {
    // console.log(process.env.JWT_SECRET)
    console.log("Database connected to scheduler")
})

// Define a function to check and update discounts
const checkAndUpdateDiscounts = async () => {
    try {
        // Find discounts that have expired
        const now = new Date();
        // console.log(now)

        // Find upcoming discounts with onGoing set to false
        const upcomingDiscounts = await discountModel.find({
            startDate: { $lt: now },
            onGoing: false
        });

        // Activate upcoming discounts
        for (const upcomingDiscount of upcomingDiscounts) {
            upcomingDiscount.onGoing = true;
            await upcomingDiscount.save();

            // Update the associated book document to add the discount ID
            const book = await bookModel.findById(upcomingDiscount.book);
            if (book) {
                let updatedPrice = book.price
                updatedPrice -= updatedPrice * (upcomingDiscount.discountPercentage / 100)
                book.discounts.push({
                    discountId: upcomingDiscount._id,
                    discountedPrice: updatedPrice
                });
                // book.discounts.push(upcomingDiscount._id);
                await book.save();
            }
        }

        // Find discounts that have expired
        const expiredDiscounts = await discountModel.find({
            endDate: { $lt: now },
            onGoing: true,
        });

        // Deactivate expired discounts
        for (const expiredDiscount of expiredDiscounts) {
            expiredDiscount.onGoing = false;
            await expiredDiscount.save();

            // Update the associated book document to remove the discount ID
            const book = await bookModel.findById(expiredDiscount.book);
            if (book) {
                // book.discounts.pull(expiredDiscount._id);
                book.discounts.pull({ discountId: expiredDiscount._id });

                await book.save();
            }
        }
    } catch (error) {
        console.error('Error checking and updating discounts:', error);
    }
};

// Call the function initially and then at regular intervals
checkAndUpdateDiscounts(); // Call immediately when your application starts

// Set up the interval to periodically check and update discounts (e.g., every 24 hours)
const intervalInMilliseconds = 15 * 1000; // 15 hours
setInterval(checkAndUpdateDiscounts, intervalInMilliseconds);


// // Define a function to check and update discounts
const checkAndUpdateCartPrice = async () => {
    try {
        // Get all active discounts
        const activeDiscounts = await discountModel.find({ onGoing: true });
        // console.log(activeDiscounts)


        // Iterate through each cart
        const carts = await cartModel.find();
        let totalSpent = 0

        for (const cart of carts) {
            for (const book of cart.bought_books) {
                const bookData = await bookModel.findById(book.id);

                if (!bookData) {
                    console.error(`Book not found for book ID: ${book.id}`);
                    continue; // Skip to the next book if book not found
                }

                // Check if the book has any discounts
                if (bookData.discounts.length === 0) {
                    // No discounts available, update the price normally
                    book.price = bookData.price;
                } else {
                    // Calculate the discounted price based on available discounts
                    const availableDiscount = activeDiscounts.find((discount) =>
                        discount.book.equals(bookData._id)
                    );
                    if (availableDiscount) {
                        // Discount found for this book, update the price accordingly
                        book.price = bookData.discounts.find(
                            (discount) => discount.discountId.equals(availableDiscount._id)
                        ).discountedPrice;
                    } else {
                        // No matching discount found, update with the next best discounted price
                        const discountedPrices = bookData.discounts.map(
                            (discount) => discount.discountedPrice
                        );

                        const minDiscountedPrice = Math.min(...discountedPrices);
                        book.price = minDiscountedPrice;
                    }
                }
            }

            // Recalculate the total_spent for the cart
            cart.total_spent = cart.bought_books.reduce(
                (total, book) => total + book.price * book.quantity,
                0
            );

            await cart.save();
        }
    } catch (error) {
        console.error('Error checking and updating discounted price in the cart:', error);
    }
};

// Call the function initially and then at regular intervals
checkAndUpdateCartPrice(); // Call immediately when your application starts

// Set up the interval to periodically check and update discounts (e.g., every 24 hours)
setInterval(checkAndUpdateCartPrice, intervalInMilliseconds);