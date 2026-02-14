import * as React from "react";
import { View, Text } from 'react-native';
import Svg, {
    Circle,
    Defs,
    RadialGradient,
    LinearGradient,
    Stop,
    Path,
    G,
    Ellipse
} from 'react-native-svg';

const SvgIcon = (props) => (
    <View style={{ alignItems: 'center' }}>
        <Svg
            xmlns="http://www.w3.org/2000/svg"
            width="300"
            height="220"
            viewBox="0 0 300 220"
            {...props}
        >
            <Circle
                cx="150"
                cy="150"
                r="140"
                fill="#2E7D32"
                stroke="#1B5E20"
                strokeWidth="4"
            />

            <Defs>
                <RadialGradient id="innerGrad" cx="0.5" cy="0.3">
                    <Stop offset="0%" stopColor="#4CAF50" />
                    <Stop offset="100%" stopColor="#2E7D32" />
                </RadialGradient>
                <LinearGradient id="leafGrad" x1="0%" x2="100%" y1="0%" y2="100%">
                    <Stop offset="0%" stopColor="#8BC34A" />
                    <Stop offset="100%" stopColor="#4CAF50" />
                </LinearGradient>
            </Defs>

            <Circle cx="150" cy="150" r="120" fill="url(#innerGrad)" />

            <Path
                fill="#FFA726"
                stroke="#FF8F00"
                strokeWidth="2"
                d="M125 130h50v35h-50z"
            />

            <Path
                fill="#D32F2F"
                stroke="#B71C1C"
                strokeWidth="2"
                d="m115 130 35-25 35 25z"
            />

            <Path fill="#5D4037" d="M142 145h16v20h-16z" />

            <Path fill="#42A5F5" d="M130 138h8v8h-8zM162 138h8v8h-8z" />

            <G transform="translate(100 180)">
                <Path
                    fill="url(#leafGrad)"
                    stroke="#689F38"
                    d="M0 0q-2-8 0-15Q2-8 0 0"
                />
                <Circle cy="-12" r="1.5" fill="#FFC107" />
                <Circle cy="-8" r="1.5" fill="#FFC107" />
                <Circle cy="-4" r="1.5" fill="#FFC107" />
            </G>

            <G transform="translate(200 180)">
                <Path
                    fill="url(#leafGrad)"
                    stroke="#689F38"
                    d="M0 0q-2-8 0-15Q2-8 0 0"
                />
                <Circle cy="-12" r="1.5" fill="#FFC107" />
                <Circle cy="-8" r="1.5" fill="#FFC107" />
                <Circle cy="-4" r="1.5" fill="#FFC107" />
            </G>

            <G stroke="#FF8F00" transform="translate(150 200)">
                <Ellipse cx="-15" fill="#FFE0B2" rx="12" ry="6" />
                <Ellipse cx="15" fill="#FFE0B2" rx="12" ry="6" />
                <Path
                    fill="none"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M-3-2q3-3 6 0"
                />
            </G>

        </Svg>

        <Text style={{
            color: '#2E7D32',
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: 10,
        }}>
            GundamShop
        </Text>

        <Text style={{
            color: '#4CAF50',
            fontSize: 12,
            marginTop: 2,
        }}>
            Ngôi Nhà Đồ Chơi
        </Text>
    </View>
);

export default SvgIcon;