# SnackSafe
Defective Potato Chip Detection

This project focuses on developing a Convolutional Neural Network (CNN) model to accurately detect defective potato chips from images. The model utilizes transfer learning with the MobileNetV2 architecture as its base, fine-tuning it for the specific task of binary classification: distinguishing between defective and non-defective potato chips.

Key Components:
Libraries and Dependencies:

The project relies on TensorFlow and Keras for building and training the CNN model.
Additional libraries like Pandas, NumPy, Matplotlib, Seaborn, and Scikit-learn are used for data handling, visualization, and evaluation.
Data Preparation:

The dataset is structured into training and testing directories, with images further classified into "Defective" and "Not Defective" categories.
Data augmentation techniques such as rotation, width/height shift, shear, zoom, and horizontal flip are applied to the training data to enhance model generalization.
The data is preprocessed by rescaling the pixel values to the range [0, 1].
Model Architecture:

The base model is MobileNetV2, pre-trained on ImageNet, with its top layers removed.
Additional layers include a GlobalAveragePooling2D layer, a Dense layer with ReLU activation, a Dropout layer for regularization, and a final Dense layer with a sigmoid activation function for binary classification.
Training Configuration:

The model is compiled using the Adam optimizer with a learning rate of 0.0001 and the binary cross-entropy loss function.
Callbacks such as ModelCheckpoint, EarlyStopping, and ReduceLROnPlateau are used to save the best model, prevent overfitting, and adjust the learning rate dynamically.
Evaluation:

The model's performance is evaluated on the test set, achieving high accuracy and low loss.
Confusion matrix and classification reports are generated to assess the model's classification performance in detail.
Visualization:

Training and validation loss and accuracy are plotted to visualize the model's learning progress over epochs.
Sample images from the training set, along with their predicted labels, are displayed to provide insights into the model's predictions.
