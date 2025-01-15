import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
  //one who is subscribing
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: (true,'subscriber ref is required')
  },
  //the one who the subscriber is subscribing to
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: (true,'channel ref is required')
  }
},{timestamps: true})

const Subscription = mongoose.model('Subscription',subscriptionSchema);

export default Subscription;