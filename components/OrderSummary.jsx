import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import AddressModal from './AddressModal';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';

const OrderSummary = ({ totalPrice, items }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const router = useRouter();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');

    // 🧾 Debug log
    useEffect(() => {
        console.log("📦 Address list in OrderSummary:", addressList);
    }, [addressList]);

    const {user} = useUser();
    const {getToken} = useAuth();

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if(!user){
                // Suggest user signs in, or redirect them. 
                // Clerk handles most redirects, but an explicit toast is helpful.
                return toast('Please login to proceed!'); 
            }

            const token = await getToken();
            const {data} = await axios.post('/api/coupon', {code : couponCodeInput}, {
                headers : {
                    // This is the correct fix for the 401 error!
                    Authorization : `Bearer ${token}` 
                }
            });

            setCoupon(data.coupon);
            toast.success('Coupon Applied');
        } catch (error) {
            
            // 🔥 CRITICAL FIX: Extract the specific error message from the server response
            const serverErrorMessage = error.response?.data?.error;

            if (serverErrorMessage) {
                // Display the error message sent from your API Route
                // e.g., "Unauthorized", "Coupon not found!", "Coupon valid for new users only."
                toast.error(serverErrorMessage);
            } else if (error.code === "ERR_BAD_REQUEST" && error.response?.status === 401) {
                // Fallback for the original error if server message is somehow missing
                toast.error("Authentication failed. Please sign in again.");
            } else {
                // Generic error for network issues or unhandled server 500
                toast.error("Failed to check coupon code."); 
                console.error("Coupon API Error:", error);
            }
            
            // Clear coupon state on failure
            setCoupon(''); 
        }
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        router.push('/orders');
    }

    // --- Discount Calculation (Improved) ---
    const shippingCost = user?.publicMetadata?.plan === 'pro' ? 0 : 5;
    
    let discountAmount = 0;
    if (coupon) {
        // Assuming your coupon object has a 'discount' field representing a percentage
        discountAmount = totalPrice * (coupon.discount / 100);
    }
    
    const finalTotal = totalPrice + shippingCost - discountAmount;
    // --- End Discount Calculation ---


    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>

            {/* Payment Method */}
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input
                    type="radio"
                    id="COD"
                    onChange={() => setPaymentMethod('COD')}
                    checked={paymentMethod === 'COD'}
                    className='accent-gray-500'
                />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input
                    type="radio"
                    id="STRIPE"
                    name='payment'
                    onChange={() => setPaymentMethod('STRIPE')}
                    checked={paymentMethod === 'STRIPE'}
                    className='accent-gray-500'
                />
                <label htmlFor="STRIPE" className='cursor-pointer'>Stripe Payment</label>
            </div>

            {/* Address Section */}
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {Array.isArray(addressList) && addressList.length > 0 && (
                                <select
                                    className="border border-slate-400 p-2 w-full my-3 outline-none rounded"
                                    onChange={(e) => {
                                        const index = e.target.value;
                                        if (index === "") {
                                            setSelectedAddress(null);
                                        } else {
                                            setSelectedAddress(addressList[index]);
                                        }
                                    }}
                                >
                                    <option value="">Select Address</option>
                                    {addressList
                                        .filter(Boolean) 
                                        .map((address, index) => (
                                            <option key={index} value={index}>
                                                {address.name}, {address.city}, {address.state}, {address.zip}
                                            </option>
                                        ))}
                                </select>
                            )}
                            <button
                                className='flex items-center gap-1 text-slate-600 mt-1'
                                onClick={() => setShowAddressModal(true)}
                            >
                                Add Address <PlusIcon size={18} />
                            </button>
                        </div>
                    )
                }
            </div>

            {/* Price Summary */}
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon ({coupon.code.toUpperCase()}):</p>} {/* Display coupon code */}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        {/* Display Shipping Cost based on the calculated 'shippingCost' variable */}
                        <p>{shippingCost === 0 ? 'Free' : `${currency}${shippingCost.toFixed(2)}`}</p> 
                        {coupon && <p>{`-${currency}${discountAmount.toFixed(2)}`}</p>}
                    </div>
                </div>

                {/* Coupon Section */}
                {!coupon ? (
                    <form
                        onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })}
                        className='flex justify-center gap-3 mt-3'
                    >
                        <input
                            onChange={(e) => setCouponCodeInput(e.target.value)}
                            value={couponCodeInput}
                            type="text"
                            placeholder='Coupon Code'
                            className='border border-slate-400 p-1.5 rounded w-full outline-none'
                        />
                        <button
                            className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'
                        >
                            Apply
                        </button>
                    </form>
                ) : (
                    <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                        <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                        <p>{coupon.description}</p>
                        <XIcon
                            size={18}
                            onClick={() => setCoupon('')}
                            className='hover:text-red-700 transition cursor-pointer'
                        />
                    </div>
                )}
            </div>

            {/* Total Section */}
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>
                    {/* Display Final Total based on the calculated 'finalTotal' variable */}
                    {currency}{finalTotal.toFixed(2)} 
                </p>
            </div>

            {/* Place Order Button */}
            <button
                onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'Placing Order...' })}
                className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'
            >
                Place Order
            </button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
        </div>
    );
};

export default OrderSummary;